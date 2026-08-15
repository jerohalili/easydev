const express = require('express');
const cors = require('cors');
const pool = require('./db.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Healthcheck Route
// ----------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ----------------------------------------------------
// Project & Questionnaire API
// ----------------------------------------------------

// 1. Create a Project
app.post('/api/projects', async (req, res) => {
  const { title = 'Untitled Project', description = '' } = req.body;
  try {
    const projResult = await pool.query(
      'INSERT INTO projects (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    const project = projResult.rows[0];

    const qResult = await pool.query('SELECT id FROM questions WHERE is_first = TRUE LIMIT 1');
    const firstQuestion = qResult.rows[0];

    res.status(201).json({
      project,
      first_question_id: firstQuestion ? firstQuestion.id : null
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 2. Fetch Question + Options by ID
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

    res.json({
      question: questionRes.rows[0],
      options: optionsRes.rows
    });
  } catch (err) {
    console.error('Error fetching question:', err);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// 3. Record Answer & Return Next Question Branch
app.post('/api/projects/:id/answers', async (req, res) => {
  const projectId = req.params.id;
  const { question_id, option_id } = req.body;

  if (!question_id || !option_id) {
    return res.status(400).json({ error: 'question_id and option_id are required' });
  }

  try {
    await pool.query(
      'INSERT INTO answers (project_id, question_id, option_id) VALUES ($1, $2, $3)',
      [projectId, question_id, option_id]
    );

    const optionRes = await pool.query('SELECT next_question_id FROM options WHERE id = $1', [option_id]);
    const nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;

    res.json({
      project_id: Number(projectId),
      question_id,
      chosen_option_id: option_id,
      next_question_id: nextQuestionId
    });
  } catch (err) {
    console.error('Error saving answer:', err);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// 4. Real Weighted Scoring Endpoint across 5 Categories
app.post('/api/projects/:id/score', async (req, res) => {
  const projectId = req.params.id;

  try {
    // Sum weights for tech items based on user's answers
    const scoresQuery = `
      SELECT 
        t.id AS tech_item_id,
        t.name,
        t.category,
        SUM(w.weight_value)::int AS total_score
      FROM answers a
      JOIN weights w ON a.option_id = w.option_id
      JOIN tech_items t ON w.tech_item_id = t.id
      WHERE a.project_id = $1
      GROUP BY t.id, t.name, t.category
      ORDER BY total_score DESC;
    `;

    const scoresRes = await pool.query(scoresQuery, [projectId]);
    const scoredItems = scoresRes.rows;

    const categories = ['language', 'frontend', 'backend', 'database', 'infrastructure'];
    const recommendations = [];

    for (const category of categories) {
      const topInCat = scoredItems.find((item) => item.category === category);

      if (topInCat) {
        // Find top contributing option to form the reasoning string
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
          ? `Recommended because you selected "${reasonRow.option_label}" for ${reasonRow.prompt_text.toLowerCase()}`
          : 'Recommended based on your project constraints.';

        recommendations.push({
          tech_item_id: topInCat.tech_item_id,
          name: topInCat.name,
          category: topInCat.category,
          score: topInCat.total_score,
          reasoning_text: reasoningText
        });

        // Persist result record
        await pool.query(
          `INSERT INTO results (project_id, tech_item_id, category, score, reasoning_text)
           VALUES ($1, $2, $3, $4, $5)`,
          [projectId, topInCat.tech_item_id, topInCat.category, topInCat.total_score, reasoningText]
        );
      }
    }

    res.json({
      project_id: Number(projectId),
      is_stub: false,
      recommendations
    });
  } catch (err) {
    console.error('Error generating score:', err);
    res.status(500).json({ error: 'Failed to score project' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});