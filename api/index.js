const express = require('express');
const cors = require('cors');
const pool = require('../server/db.js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// A safe, broadly-applicable default per category, used only when a category
// scored zero — i.e. nothing in the user's answers pointed anywhere, usually
// because they answered "I don't know" for the questions that would have.
// Prefixing the reasoning text with this marker lets the client detect and
// badge these picks distinctly, without needing a schema change or a new
// field in the API response (it round-trips through the `results` table
// unchanged, so it also survives loading a project from history).
const SAFE_DEFAULT_MARKER = 'Default pick:';
const SAFE_DEFAULTS = {
  language: 1,        // JavaScript / TypeScript
  frontend: 10,        // Next.js (React)
  backend: 20,          // Node.js (Express / NestJS)
  database: 30,          // PostgreSQL
  infrastructure: 40     // Vercel / Netlify
};

// ------------------------------------------------------------------
// Experience gate (question 99) + progressive disclosure
// ------------------------------------------------------------------
// Question 99 ("How would you describe your coding background?") is asked
// first but carries no weights of its own — it only decides two things:
// (1) which project.experience_level gets stored, and (2) whether a couple
// of nuance questions later in the flow get silently auto-answered with a
// safe default instead of shown, so a total beginner isn't asked to make a
// judgment call they don't yet have context for.
const EXPERIENCE_OPTION_LEVELS = {
  991: 'brand_new',
  992: 'some_experience',
  993: 'comfortable',
  994: 'experienced'
};

// question_id -> option_id to silently record for that question when the
// project's experience_level is 'brand_new'. Both defaults are genuinely
// beginner-appropriate answers (fastest setup, free tier), not placeholders.
const AUTO_ANSWER_FOR_BEGINNERS = {
  6: 601, // "Need fastest possible setup"
  8: 801  // "Strictly free tier or open-source self-hosted"
};

// ------------------------------------------------------------------
// Primary-question boosting (fixes signal dilution)
// ------------------------------------------------------------------
// Some categories have one question that asks about them directly (Q4 asks
// literally "what data storage fits your project", Q7 asks literally "where
// do you plan to host", Q5 asks literally "what languages are you
// comfortable with"). Every other question only contributes *incidental*
// points to that category as a side effect of answering something else.
//
// Previously all weight rows counted equally, which meant incidental points
// accumulated across several unrelated questions could outscore — and
// silently override — what the user explicitly said in the one question
// that was actually asking. Example: a user picks "Flexible JSON documents"
// on Q4 (an explicit vote for MongoDB), but Postgres wins anyway because
// three unrelated questions (project type, budget, timeline) each happened
// to nudge Postgres a little.
//
// Rather than hand-editing dozens of raw weight numbers (error-prone, and
// it would make the `weights` table stop reflecting each answer's honest
// face-value relevance), the fix is applied here, at query time: weight
// rows that come from a category's primary question are boosted by
// PRIMARY_BOOST_MULTIPLIER before summing. This is the same idea as "field
// boosting" in search-ranking systems — a match in a more authoritative
// field counts for more than the same term appearing incidentally elsewhere.
const PRIMARY_QUESTION_BY_CATEGORY = {
  language: 5,
  database: 4,
  infrastructure: 7
  // frontend and backend have no single dedicated question — they're
  // genuinely inferred from a spread of project-type/workload answers by
  // design, so no boost is applied there.
};
// Derived from a worst-case analysis (every applicable multi-select option
// picked, across every non-primary question, for a single tech item) rather
// than picked arbitrarily: infrastructure needed the largest margin, at a
// ~4.1x multiplier, for Vercel/Netlify's maximum possible incidental score
// (48, spread across Q1/Q2/Q6/Q8/Q9) to no longer be able to outscore AWS's
// direct Q7 answer (12 x multiplier). 5x clears every category with room
// to spare — see the worst-case table in this fix's test notes.
const PRIMARY_BOOST_MULTIPLIER = 5;

// ------------------------------------------------------------------
// Contradiction detection
// ------------------------------------------------------------------
// A small set of option pairs that don't make sense together within the
// same project. Checked once at scoring time; surfaced to the user as
// non-blocking warnings rather than silently picking one side.
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

// Margin (in points) a "no [layer] needed" pick must beat the runner-up by
// in that category before the app commits to it outright. Below this
// margin, the pick is still shown, but flagged needs_confirmation so the
// client asks the user to confirm rather than stating it as settled fact.
// This directly guards against a thin, accidental "no layer" win — e.g. one
// offhand answer being enough to silently decide a beginner's project
// doesn't need a database.
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

// 1. Get All Projects History with Recommended Stacks Summary
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
    console.error('Error fetching project history:', err);
    res.status(500).json({ error: 'Failed to fetch project history' });
  }
});

// 2. Get Single Project Details with Saved Answers and Results
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
    console.error('Error fetching project detail:', err);
    res.status(500).json({ error: 'Failed to fetch project detail' });
  }
});

// 3. Delete Project from History
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 4. Create Project
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
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// helper: walk forward from a question along its default (first-option) path,
// counting how many questions remain including this one. Safe here because
// every sibling option for a given question shares the same next_question_id
// except Q1, where it's a reasonable estimate for the ~ shown before Q1 is answered.
// Known limitation: this walk is static and doesn't know a given project's
// experience_level, so it still counts Q6/Q8 as steps even for a brand-new
// coder whose answers there get auto-filled (see AUTO_ANSWER_FOR_BEGINNERS).
// The progress bar can therefore run slightly ahead of the questions actually
// shown to that user — cosmetic only, doesn't affect scoring.
async function countStepsFromIncluding(questionId) {
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

// 5. Fetch Question & Options
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

    const remainingSteps = await countStepsFromIncluding(Number(id));

    res.json({ question: questionRes.rows[0], options: optionsRes.rows, remaining_steps: remainingSteps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// 6b. Get an ordered summary of every question answered so far for a
// project — powers the "review your answers before we recommend" screen.
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
    console.error('Error fetching answer summary:', err);
    res.status(500).json({ error: 'Failed to fetch answer summary' });
  }
});

// 6. Record Answers (Accepts single option_id or array of option_ids)
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

    // Question 99 is the experience gate, not a scored question: persist the
    // chosen level onto the project so later steps can read it back.
    if (Number(question_id) === 99) {
      const level = EXPERIENCE_OPTION_LEVELS[targetOptionIds[0]] || null;
      await pool.query('UPDATE projects SET experience_level = $1 WHERE id = $2', [level, projectId]);
    }

    // Progressive disclosure: a self-reported brand-new coder skips the
    // setup-urgency and budget-tier questions and gets a sensible default
    // recorded automatically instead, since those are judgment calls a
    // total beginner usually can't answer confidently yet. This can chain
    // (e.g. landing on Q6 then immediately auto-skipping to Q7, and again
    // if Q7 also happened to be an auto-skip question).
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

    return res.json({ project_id: Number(projectId), next_question_id: nextQuestionId });
  } catch (err) {
    console.error('Error recording answers:', err);
    res.status(500).json({ error: 'Failed to record answers' });
  }
});

// 7. Dynamic Weighted Scoring Engine
app.post('/api/projects/:id/score', async (req, res) => {
  const projectId = req.params.id;

  try {
    // Boost weight rows that come from a category's primary/direct question
    // (see PRIMARY_QUESTION_BY_CATEGORY) so an explicit answer to the
    // question that's actually asking about a category can't be quietly
    // outvoted by incidental points accumulated from unrelated questions.
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

    // Contradiction check: flag option pairs that don't logically fit
    // together, so the user sees a heads-up rather than a silently
    // resolved conflict.
    const answeredRes = await pool.query('SELECT option_id FROM answers WHERE project_id = $1', [projectId]);
    const answeredIds = new Set(answeredRes.rows.map(r => r.option_id));
    const warnings = CONTRADICTION_RULES
      .filter(rule => rule.ids.every(id => answeredIds.has(id)))
      .map(rule => rule.message);

    const categories = ['language', 'frontend', 'backend', 'database', 'infrastructure'];
    const recommendations = [];

    for (const category of categories) {
      const itemsInCat = scoredItems.filter(i => i.category === category);
      const topInCat = itemsInCat[0];

      if (topInCat && topInCat.total_score > 0) {
        const constraintQuery = `
          SELECT DISTINCT o.label AS option_label
          FROM answers a
          JOIN options o ON a.option_id = o.id
          JOIN weights w ON a.option_id = w.option_id
          WHERE a.project_id = $1 AND w.tech_item_id = $2
          ORDER BY o.label ASC
          LIMIT 3;
        `;
        const constraintRes = await pool.query(constraintQuery, [projectId, topInCat.tech_item_id]);
        const keyChoices = constraintRes.rows.map(r => r.option_label).join(' & ');

        // Guardrail: a "no [layer] needed" pick (id 50/51/52) is a bigger
        // claim than a normal tech pick — it tells the user to skip an
        // entire layer. If it only barely beat the runner-up, don't state
        // that as settled fact; flag it so the client asks for confirmation
        // instead of silently committing to it.
        const runnerUp = itemsInCat[1];
        const margin = runnerUp ? topInCat.total_score - runnerUp.total_score : topInCat.total_score;
        const needsConfirmation = NO_LAYER_TECH_ITEM_IDS.has(topInCat.tech_item_id) && margin < CONFIDENCE_MARGIN_THRESHOLD;

        const reasoningText = needsConfirmation
          ? `${topInCat.description} Your answers leaned this way, but not by much — worth double-checking: ${keyChoices || 'your recent answers'} pointed here, but it was close.`
          : `${topInCat.description} Recommended because your choices prioritized: ${keyChoices || 'optimal system alignment'}.`;

        recommendations.push({
          tech_item_id: topInCat.tech_item_id,
          name: topInCat.name,
          category: topInCat.category,
          score: topInCat.total_score,
          reasoning_text: reasoningText,
          trade_offs: topInCat.trade_offs,
          needs_confirmation: needsConfirmation
        });

        await pool.query(
          `INSERT INTO results (project_id, tech_item_id, category, score, reasoning_text, needs_confirmation)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [projectId, topInCat.tech_item_id, topInCat.category, topInCat.total_score, reasoningText, needsConfirmation]
        );
      } else {
        // Nothing scored for this category at all — the user's answers never
        // pointed anywhere here (typically several "I don't know" answers in
        // a row). Rather than leaving the category empty, fall back to a
        // safe, industry-standard default so the user always gets a
        // complete, usable stack to start with.
        const defaultId = SAFE_DEFAULTS[category];
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
    console.error('Error scoring:', err);
    res.status(500).json({ error: 'Failed to score project' });
  }
});

// 8. Get All Tech Items
app.get('/api/tech-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tech_items ORDER BY category, name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tech items' });
  }
});

// 9. Get User-Built Custom Stack Choices
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
    res.status(500).json({ error: 'Failed to fetch user stack' });
  }
});

// 10. Save/Update Custom User Stack Choice
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
    res.json({ message: 'User stack choice saved' });
  } catch (err) {
    console.error('Save user stack error:', err);
    res.status(500).json({ error: 'Failed to save user stack choice' });
  }
});

module.exports = app;