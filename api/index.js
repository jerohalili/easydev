const express = require('express');
const cors = require('cors');
const pool = require('../db/db.js');
require('dotenv').config({ quiet: true });

const app = express();

app.use(cors());
app.use(express.json());

// EasyDev proposal scoring engine — one Express app exported as a single
// Vercel serverless fn (see vercel.json). Table names like tech_items stay
// as-is; they're the seeded stack catalog juniors pick from.

// Juniors answering "I don't know" everywhere in a layer score zero there —
// fall back to a safe industry default so the proposal still has 5 picks.
const SAFE_DEFAULT_MARKER = 'Default pick:'; // must match ResultsView.jsx strip logic
const SAFE_DEFAULTS = {
  language: 1,        // JavaScript / TypeScript
  frontend: 10,        // Next.js (React)
  backend: 20,          // Node.js (Express / NestJS)
  database: 30,          // PostgreSQL
  infrastructure: 40     // Vercel / Netlify
};

// Q99 is just a UX gate for brand-new coders, not scored itself
const EXPERIENCE_OPTION_LEVELS = {
  991: 'brand_new',
  992: 'some_experience',
  993: 'comfortable',
  994: 'experienced'
};

// question_id -> option_id auto-answers for brand_new proposals (skip judgment calls)
const AUTO_ANSWER_FOR_BEGINNERS = {
  6: 601, // "Need fastest possible setup"
  8: 801  // "Strictly free tier or open-source self-hosted"
};

// Direct-layer questions get 5x so a stray point can't beat an explicit pick.
// Found this when incidental answers kept outranking Q5's language choice.
const PRIMARY_QUESTION_BY_CATEGORY = {
  language: 5,
  database: 4,
  infrastructure: 7
  // frontend/backend have no single dedicated question — inferred from spread
};
const PRIMARY_BOOST_MULTIPLIER = 5;

// Proposal contradiction flags — e.g. "needs realtime" + "no backend logic".
// Shown as heads-ups, not blockers; juniors slip on Q3 wording a lot.
const CONTRADICTION_RULES = [
  {
    ids: [305, 302],
    message: 'You said this project needs real-time features (live chat / WebSockets), but also that it needs no backend logic. Real-time features need a server to coordinate them — double check your answer to "specialized feature or workload."'
  },
  {
    ids: [305, 303],
    message: 'You said this project needs heavy background jobs or AI inference, but also that it needs no backend logic. That kind of processing needs somewhere to run — double check your answer to "specialized feature or workload."'
  },
  {
    ids: [305, 304],
    message: 'You said this project needs high-concurrency API handling, but also that it needs no backend logic. Double check your answer to "specialized feature or workload" — these two don\'t fit together.'
  },
  {
    ids: [101, 1001],
    message: 'You described this as a simple content site / blog / portfolio, but also said it needs user accounts and login. That\'s a perfectly normal combination (e.g. a membership blog) — just flagging it in case one of those answers was a slip.'
  }
];

async function getProposalFlags(projectId) {
  const answeredRes = await pool.query('SELECT option_id FROM answers WHERE project_id = $1', [projectId]);
  const answeredIds = new Set(answeredRes.rows.map(r => r.option_id));
  return CONTRADICTION_RULES
    .filter(rule => rule.ids.every(id => answeredIds.has(id)))
    .map(rule => rule.message);
}

// "No layer needed" (ids 50/51/52) needs a clear margin or we ask the junior
// to confirm — it won by accident once on a 1-point margin.
const CONFIDENCE_MARGIN_THRESHOLD = 6;
const NO_LAYER_TECH_ITEM_IDS = new Set([50, 51, 52]);

// Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// 1. Proposal history with stack-pick summary for the dashboard
app.get('/api/projects', async (req, res) => {
  try {
    const projectsQuery = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'tech_item_id', r.tech_item_id,
              'name', t.name,
              'category', r.category,
              'score', r.score,
              'reasoning_text', r.reasoning_text,
              'trade_offs', t.trade_offs
            )
          ) FILTER (WHERE r.id IS NOT NULL), '[]'
        ) AS recommendations
      FROM projects p
      LEFT JOIN results r ON p.id = r.project_id
      LEFT JOIN tech_items t ON r.tech_item_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(projectsQuery);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching proposal history:', err);
    res.status(500).json({ error: 'Failed to load proposal history' });
  }
});

// 2. Single proposal with saved questionnaire answers + stack picks
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const resultsRes = await pool.query(
      `SELECT r.*, t.name, t.description, t.trade_offs FROM results r 
       JOIN tech_items t ON r.tech_item_id = t.id 
       WHERE r.project_id = $1`,
      [id]
    );

    const answersRes = await pool.query(
      `SELECT a.question_id, q.prompt_text, o.label AS selected_option 
       FROM answers a 
       JOIN questions q ON a.question_id = q.id 
       JOIN options o ON a.option_id = o.id 
       WHERE a.project_id = $1`,
      [id]
    );

    res.json({
      project: projectRes.rows[0],
      recommendations: resultsRes.rows,
      answers: answersRes.rows
    });
  } catch (err) {
    console.error('Error fetching proposal detail:', err);
    res.status(500).json({ error: 'Failed to load proposal detail' });
  }
});

// 3. Delete proposal from history
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// 4. Create proposal (title + optional workload description)
app.post('/api/projects', async (req, res) => {
  const { title = 'Untitled Project', description = '' } = req.body;
  try {
    const projResult = await pool.query(
      'INSERT INTO projects (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    const qResult = await pool.query('SELECT id FROM questions WHERE is_first = TRUE LIMIT 1');
    res.status(201).json({
      project: projResult.rows[0],
      first_question_id: qResult.rows[0] ? qResult.rows[0].id : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Static walk for the progress bar — branching means path length varies,
// so count from here instead of assuming a fixed total.
async function countProposalStepsFrom(questionId) {
  let count = 0;
  let current = questionId;
  const visited = new Set();
  while (current && !visited.has(current)) {
    visited.add(current);
    count++;
    const { rows } = await pool.query(
      'SELECT next_question_id FROM options WHERE question_id = $1 LIMIT 1',
      [current]
    );
    current = rows[0] ? rows[0].next_question_id : null;
  }
  return count;
}

// 5. Questionnaire step + options
app.get('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const questionRes = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    if (questionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const optionsRes = await pool.query(
      'SELECT id, label, next_question_id, is_unsure FROM options WHERE question_id = $1 ORDER BY id ASC',
      [id]
    );

    const remainingSteps = await countProposalStepsFrom(Number(id));

    res.json({ question: questionRes.rows[0], options: optionsRes.rows, remaining_steps: remainingSteps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load questionnaire step' });
  }
});

// 6b. Proposal answer summary for the review screen
app.get('/api/projects/:id/summary', async (req, res) => {
  const projectId = req.params.id;
  try {
    const summaryQuery = `
      SELECT
        q.id AS question_id,
        q.prompt_text,
        q.is_multiselect,
        MIN(a.created_at) AS answered_at,
        json_agg(json_build_object('id', o.id, 'label', o.label) ORDER BY o.id ASC) AS selected_options
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN options o ON a.option_id = o.id
      WHERE a.project_id = $1
      GROUP BY q.id, q.prompt_text, q.is_multiselect
      ORDER BY answered_at ASC;
    `;
    const result = await pool.query(summaryQuery, [projectId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching proposal answer summary:', err);
    res.status(500).json({ error: 'Failed to load proposal review' });
  }
});

// 6. Record questionnaire answers (single option_id or option_ids array)
app.post('/api/projects/:id/answers', async (req, res) => {
  const projectId = req.params.id;
  const { question_id, option_id, option_ids } = req.body;

  const targetOptionIds = option_ids && Array.isArray(option_ids) ? option_ids : (option_id ? [option_id] : []);

  if (targetOptionIds.length === 0) {
    return res.status(400).json({ error: 'No option selected' });
  }

  try {
    await pool.query('DELETE FROM answers WHERE project_id = $1 AND question_id = $2', [projectId, question_id]);

    for (const optId of targetOptionIds) {
      await pool.query(
        'INSERT INTO answers (project_id, question_id, option_id) VALUES ($1, $2, $3)',
        [projectId, question_id, optId]
      );
    }

    const optionRes = await pool.query('SELECT next_question_id FROM options WHERE id = $1', [targetOptionIds[0]]);
    let nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;

    // Q99 is UX gate only, not scored — persist level for later steps
    if (Number(question_id) === 99) {
      const level = EXPERIENCE_OPTION_LEVELS[targetOptionIds[0]] || null;
      await pool.query('UPDATE projects SET experience_level = $1 WHERE id = $2', [level, projectId]);
    }

    // Auto-skip judgment questions for brand-new coders
    while (nextQuestionId && AUTO_ANSWER_FOR_BEGINNERS[nextQuestionId]) {
      const projRes = await pool.query('SELECT experience_level FROM projects WHERE id = $1', [projectId]);
      if (projRes.rows[0]?.experience_level !== 'brand_new') break;

      const autoOptionId = AUTO_ANSWER_FOR_BEGINNERS[nextQuestionId];
      await pool.query('DELETE FROM answers WHERE project_id = $1 AND question_id = $2', [projectId, nextQuestionId]);
      await pool.query(
        'INSERT INTO answers (project_id, question_id, option_id) VALUES ($1, $2, $3)',
        [projectId, nextQuestionId, autoOptionId]
      );
      const skipRes = await pool.query('SELECT next_question_id FROM options WHERE id = $1', [autoOptionId]);
      nextQuestionId = skipRes.rows[0] ? skipRes.rows[0].next_question_id : null;
    }

    const warnings = await getProposalFlags(projectId);
    return res.json({ project_id: Number(projectId), next_question_id: nextQuestionId, warnings });
  } catch (err) {
    console.error('Error recording proposal answers:', err);
    res.status(500).json({ error: 'Failed to save proposal answers' });
  }
});

// 7. Weighted stack scoring — sums weights per tech across the proposal's answers.
// Re-scores append new results rows (history preserved); the old version deleted
// them and wiped the timeline, don't go back to that.

app.post('/api/projects/:id/score', async (req, res) => {
  const projectId = req.params.id;

  try {
    // Apply primary-question boost to prevent incidental points from winning
    const scoresQuery = `
      SELECT 
        t.id AS tech_item_id,
        t.name,
        t.category,
        t.description,
        t.trade_offs,
        COALESCE(SUM(
          w.weight_value * CASE
            WHEN t.category = 'language' AND a.question_id = 5 THEN ${PRIMARY_BOOST_MULTIPLIER}
            WHEN t.category = 'database' AND a.question_id = 4 THEN ${PRIMARY_BOOST_MULTIPLIER}
            WHEN t.category = 'infrastructure' AND a.question_id = 7 THEN ${PRIMARY_BOOST_MULTIPLIER}
            ELSE 1
          END
        ), 0)::int AS total_score
      FROM tech_items t
      JOIN weights w ON w.tech_item_id = t.id
      JOIN answers a ON a.option_id = w.option_id
      WHERE a.project_id = $1
      GROUP BY t.id, t.name, t.category, t.description, t.trade_offs
      ORDER BY total_score DESC;
    `;

    const scoresRes = await pool.query(scoresQuery, [projectId]);
    const scoredItems = scoresRes.rows;

    // Flags for proposals reopened from history (not freshly scored)
    const warnings = await getProposalFlags(projectId);

    const STACK_LAYERS = ['language', 'frontend', 'backend', 'database', 'infrastructure'];
    const recommendations = [];

    for (const stackLayer of STACK_LAYERS) {
      const layerPicks = scoredItems.filter(i => i.category === stackLayer);
      const topStackPick = layerPicks[0];

      if (topStackPick && topStackPick.total_score > 0) {
        const constraintQuery = `
          SELECT DISTINCT o.label AS option_label
          FROM answers a
          JOIN options o ON a.option_id = o.id
          JOIN weights w ON a.option_id = w.option_id
          WHERE a.project_id = $1 AND w.tech_item_id = $2
          ORDER BY o.label ASC
          LIMIT 3;
        `;
        const constraintRes = await pool.query(constraintQuery, [projectId, topStackPick.tech_item_id]);
        const keyChoices = constraintRes.rows.map(r => r.option_label).join(' & ');

        // Low-confidence "no layer needed" pick — ask the junior to confirm
        const runnerUpPick = layerPicks[1];
        const margin = runnerUpPick ? topStackPick.total_score - runnerUpPick.total_score : topStackPick.total_score;
        const needsConfirmation = NO_LAYER_TECH_ITEM_IDS.has(topStackPick.tech_item_id) && margin < CONFIDENCE_MARGIN_THRESHOLD;

        const reasoningText = needsConfirmation
          ? `${topStackPick.description} Your proposal answers leaned this way, but not by much — worth double-checking: ${keyChoices || 'your recent answers'} pointed here, but it was close.`
          : `${topStackPick.description} Recommended because your proposal prioritized: ${keyChoices || 'optimal system alignment'}.`;

        recommendations.push({
          tech_item_id: topStackPick.tech_item_id,
          name: topStackPick.name,
          category: topStackPick.category,
          score: topStackPick.total_score,
          reasoning_text: reasoningText,
          trade_offs: topStackPick.trade_offs,
          needs_confirmation: needsConfirmation
        });

        await pool.query(
          `INSERT INTO results (project_id, tech_item_id, category, score, reasoning_text, needs_confirmation)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [projectId, topStackPick.tech_item_id, topStackPick.category, topStackPick.total_score, reasoningText, needsConfirmation]
        );
      } else {
        // Nobody scored here (all unsure) — safe industry default for this stack layer
        const defaultId = SAFE_DEFAULTS[stackLayer];
        if (defaultId) {
          const defaultRes = await pool.query('SELECT * FROM tech_items WHERE id = $1', [defaultId]);
          const defaultItem = defaultRes.rows[0];

          if (defaultItem) {
            const reasoningText = `${SAFE_DEFAULT_MARKER} ${defaultItem.description} Your answers didn't point strongly toward a specific choice here, so we picked a safe, widely-used option to get you started — you can always change this later.`;

            recommendations.push({
              tech_item_id: defaultItem.id,
              name: defaultItem.name,
              category: defaultItem.category,
              score: 0,
              reasoning_text: reasoningText,
              trade_offs: defaultItem.trade_offs,
              needs_confirmation: false
            });

            await pool.query(
              `INSERT INTO results (project_id, tech_item_id, category, score, reasoning_text, needs_confirmation)
               VALUES ($1, $2, $3, $4, $5, FALSE)`,
              [projectId, defaultItem.id, defaultItem.category, 0, reasoningText]
            );
          }
        }
      }
    }

    res.json({ project_id: Number(projectId), recommendations, warnings });
  } catch (err) {
    console.error('Error scoring proposal:', err);
    res.status(500).json({ error: 'Failed to score proposal stack' });
  }
});

// 8. Stack catalog (all tech_items for the comparison view)
app.get('/api/tech-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tech_items ORDER BY category, name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stack catalog' });
  }
});

// 9. Manual stack overrides for a proposal
app.get('/api/projects/:id/user-stack', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT u.category, u.tech_item_id, u.notes, t.name 
      FROM user_stacks u
      JOIN tech_items t ON u.tech_item_id = t.id
      WHERE u.project_id = $1
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load manual stack picks' });
  }
});

// 10. Save/override one layer of the manual stack
app.post('/api/projects/:id/user-stack', async (req, res) => {
  const { id } = req.params;
  const { category, tech_item_id, notes = '' } = req.body;

  try {
    const query = `
      INSERT INTO user_stacks (project_id, category, tech_item_id, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, category)
      DO UPDATE SET tech_item_id = EXCLUDED.tech_item_id, notes = EXCLUDED.notes;
    `;
    await pool.query(query, [id, category, tech_item_id, notes]);
    res.json({ message: 'Manual stack pick saved' });
  } catch (err) {
    console.error('Save manual stack pick error:', err);
    res.status(500).json({ error: 'Failed to save manual stack pick' });
  }
});

module.exports = app;