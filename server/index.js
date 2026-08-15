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
              'reasoning_text', r.reasoning_text
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
      `SELECT r.*, t.name FROM results r 
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

// 5. Fetch Question & Options (Ensuring "I don't know" option exists per question)
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

    let options = optionsRes.rows;
    
    // Fallback: If no neutral option was manually seeded, inject a default "I don't know"
    const hasDontKnow = options.some(o => o.label.toLowerCase().includes('don\'t know') || o.label.toLowerCase().includes('not sure'));
    if (!hasDontKnow && options.length > 0) {
      const defaultNextQ = options[0].next_question_id;
      options.push({
        id: -Number(id), // Dynamic negative ID for client reference
        label: "I don't know / Not sure yet (Use neutral defaults)",
        next_question_id: defaultNextQ
      });
    }

    res.json({ question: questionRes.rows[0], options });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// 6. Record Answer
app.post('/api/projects/:id/answers', async (req, res) => {
  const projectId = req.params.id;
  const { question_id, option_id } = req.body;

  try {
    // If positive real option_id, save to answers table
    if (option_id > 0) {
      await pool.query(
        'INSERT INTO answers (project_id, question_id, option_id) VALUES ($1, $2, $3)',
        [projectId, question_id, option_id]
      );
      const optionRes = await pool.query('SELECT next_question_id FROM options WHERE id = $1', [option_id]);
      const nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;
      return res.json({ project_id: Number(projectId), next_question_id: nextQuestionId });
    } else {
      // "I don't know" selected: lookup next question ID without saving a weighted answer
      const qId = Math.abs(option_id);
      const optionRes = await pool.query('SELECT next_question_id FROM options WHERE question_id = $1 LIMIT 1', [qId]);
      const nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;
      return res.json({ project_id: Number(projectId), next_question_id: nextQuestionId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// 7. Dynamic Weighted Scoring Engine
app.post('/api/projects/:id/score', async (req, res) => {
  const projectId = req.params.id;

  try {
    // Clear past results if re-scoring
    await pool.query('DELETE FROM results WHERE project_id = $1', [projectId]);

    // Calculate score per tech item based ONLY on selected option answers
    const scoresQuery = `
      SELECT 
        t.id AS tech_item_id,
        t.name,
        t.category,
        COALESCE(SUM(w.weight_value), 0)::int AS total_score
      FROM tech_items t
      JOIN weights w ON w.tech_item_id = t.id
      JOIN answers a ON a.option_id = w.option_id
      WHERE a.project_id = $1
      GROUP BY t.id, t.name, t.category
      ORDER BY total_score DESC;
    `;

    const scoresRes = await pool.query(scoresQuery, [projectId]);
    const scoredItems = scoresRes.rows;

    const categories = ['language', 'frontend', 'backend', 'database', 'infrastructure'];
    const recommendations = [];

    for (const category of categories) {
      let topInCat = scoredItems.find(i => i.category === category);

      // Fallback baseline if no option added points to this category
      if (!topInCat) {
        const fallbackRes = await pool.query(
          'SELECT id AS tech_item_id, name, category FROM tech_items WHERE category = $1 LIMIT 1',
          [category]
        );
        if (fallbackRes.rows[0]) {
          topInCat = { ...fallbackRes.rows[0], total_score: 0 };
        }
      }

      if (topInCat) {
        const reasoningQuery = `
          SELECT o.label AS option_label, q.prompt_text
          FROM answers a
          JOIN options o ON a.option_id = o.id
          JOIN questions q ON a.question_id = q.id
          JOIN weights w ON a.option_id = w.option_id
          WHERE a.project_id = $1 AND w.tech_item_id = $2
          ORDER BY w.weight_value DESC
          LIMIT 1;
        `;
        const reasonRes = await pool.query(reasoningQuery, [projectId, topInCat.tech_item_id]);
        const reasonRow = reasonRes.rows[0];

        const reasoningText = reasonRow
          ? `Selected because you chose "${reasonRow.option_label}" for ${reasonRow.prompt_text.toLowerCase()}`
          : `Standard industry baseline pick for ${category} tier.`;

        recommendations.push({
          tech_item_id: topInCat.tech_item_id,
          name: topInCat.name,
          category: topInCat.category,
          score: topInCat.total_score,
          reasoning_text: reasoningText
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});