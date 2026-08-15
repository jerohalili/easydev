const express = require('express');
const cors = require('cors');
const pool = require('./db.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
      'SELECT id, label, next_question_id FROM options WHERE question_id = $1 ORDER BY id ASC',
      [id]
    );

    const remainingSteps = await countStepsFromIncluding(Number(id));

    res.json({ question: questionRes.rows[0], options: optionsRes.rows, remaining_steps: remainingSteps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
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
    const nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;

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
    const scoresQuery = `
      SELECT 
        t.id AS tech_item_id,
        t.name,
        t.category,
        t.description,
        t.trade_offs,
        COALESCE(SUM(w.weight_value), 0)::int AS total_score
      FROM tech_items t
      JOIN weights w ON w.tech_item_id = t.id
      JOIN answers a ON a.option_id = w.option_id
      WHERE a.project_id = $1
      GROUP BY t.id, t.name, t.category, t.description, t.trade_offs
      ORDER BY total_score DESC;
    `;

    const scoresRes = await pool.query(scoresQuery, [projectId]);
    const scoredItems = scoresRes.rows;

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

        const reasoningText = `${topInCat.description} Recommended because your choices prioritized: ${keyChoices || 'optimal system alignment'}.`;

        recommendations.push({
          tech_item_id: topInCat.tech_item_id,
          name: topInCat.name,
          category: topInCat.category,
          score: topInCat.total_score,
          reasoning_text: reasoningText,
          trade_offs: topInCat.trade_offs
        });

        await pool.query(
          `INSERT INTO results (project_id, tech_item_id, category, score, reasoning_text)
           VALUES ($1, $2, $3, $4, $5)`,
          [projectId, topInCat.tech_item_id, topInCat.category, topInCat.total_score, reasoningText]
        );
      }
    }

    res.json({ project_id: Number(projectId), recommendations });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});