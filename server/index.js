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
// Step 4 Endpoints
// ----------------------------------------------------

// 1. Create a new project & get initial question ID
app.post('/api/projects', async (req, res) => {
  const { title = 'Untitled Project', description = '' } = req.body;
  try {
    // Create project record
    const projResult = await pool.query(
      'INSERT INTO projects (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    const project = projResult.rows[0];

    // Find the starting question (is_first = TRUE)
    const qResult = await pool.query(
      'SELECT id FROM questions WHERE is_first = TRUE LIMIT 1'
    );
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

// 2. GET /api/questions/:id (returns question prompt + list of selectable options)
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

// 3. POST /api/projects/:id/answers (record an answer, return next_question_id)
app.post('/api/projects/:id/answers', async (req, res) => {
  const projectId = req.params.id;
  const { question_id, option_id } = req.body;

  if (!question_id || !option_id) {
    return res.status(400).json({ error: 'question_id and option_id are required' });
  }

  try {
    // Record user answer
    await pool.query(
      'INSERT INTO answers (project_id, question_id, option_id) VALUES ($1, $2, $3)',
      [projectId, question_id, option_id]
    );

    // Look up chosen option's next_question_id to trigger branching
    const optionRes = await pool.query(
      'SELECT next_question_id FROM options WHERE id = $1',
      [option_id]
    );

    const nextQuestionId = optionRes.rows[0] ? optionRes.rows[0].next_question_id : null;

    res.json({
      project_id: Number(projectId),
      question_id,
      chosen_option_id: option_id,
      next_question_id: nextQuestionId // null means end of flow
    });
  } catch (err) {
    console.error('Error saving answer:', err);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// 4. POST /api/projects/:id/score (Stub endpoint returning hardcoded scores for now)
app.post('/api/projects/:id/score', async (req, res) => {
  const projectId = req.params.id;

  try {
    // Fake results stub matching the required schema output structure
    const stubResults = [
      {
        tech_item_id: 1,
        name: 'TypeScript',
        category: 'language',
        score: 11,
        reasoning_text: 'High type-safety requirement and Node.js backend preference.'
      },
      {
        tech_item_id: 4,
        name: 'React',
        category: 'framework',
        score: 12,
        reasoning_text: 'Ideal fit for rich fullstack client application requirements.'
      },
      {
        tech_item_id: 7,
        name: 'PostgreSQL',
        category: 'database',
        score: 10,
        reasoning_text: 'Best fit for relational schema with ACID transaction guarantees.'
      }
    ];

    res.json({
      project_id: Number(projectId),
      is_stub: true,
      recommendations: stubResults
    });
  } catch (err) {
    console.error('Error generating score:', err);
    res.status(500).json({ error: 'Failed to score project' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});