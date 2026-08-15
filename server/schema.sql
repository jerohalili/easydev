-- Drop existing tables for clean re-runs
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS weights CASCADE;
DROP TABLE IF EXISTS tech_items CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Projects
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Questions
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  is_first BOOLEAN DEFAULT FALSE
);

-- 3. Options (Branching: next_question_id = NULL means terminal question)
CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  next_question_id INT REFERENCES questions(id) ON DELETE SET NULL
);

-- 4. Tech Items
CREATE TABLE tech_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL -- 'language', 'framework', 'database'
);

-- 5. Weights Matrix
CREATE TABLE weights (
  id SERIAL PRIMARY KEY,
  option_id INT REFERENCES options(id) ON DELETE CASCADE,
  tech_item_id INT REFERENCES tech_items(id) ON DELETE CASCADE,
  weight_value INT NOT NULL
);

-- 6. User Answers
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  option_id INT REFERENCES options(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Results History
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  tech_item_id INT REFERENCES tech_items(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  reasoning_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- SEED DATA (Step 3)
-- ========================================================

-- Tech Items
INSERT INTO tech_items (id, name, category) VALUES
(1, 'TypeScript', 'language'),
(2, 'Python', 'language'),
(3, 'Go', 'language'),
(4, 'React', 'framework'),
(5, 'FastAPI', 'framework'),
(6, 'Express', 'framework'),
(7, 'PostgreSQL', 'database'),
(8, 'MongoDB', 'database'),
(9, 'Redis', 'database');

-- Questions (Branching Tree)
INSERT INTO questions (id, prompt_text, is_first) VALUES
(1, 'What primary platform are you building for?', TRUE),
(2, 'What is your project type/focus?', FALSE),      -- Web Path
(3, 'How complex is your data schema?', FALSE),        -- Data Path
(4, 'What is your team primary expertise?', FALSE);   -- Terminal branch

-- Options with Branching Logic
INSERT INTO options (id, question_id, label, next_question_id) VALUES
-- Q1: Platform
(1, 1, 'Web Application', 2),
(2, 1, 'Data / AI API Service', 3),

-- Q2: Web Focus (From Q1 Option 1)
(3, 2, 'Fullstack Web App', 4),
(4, 2, 'Lightweight REST API', 4),

-- Q3: Data Focus (From Q1 Option 2)
(5, 3, 'Strict relational & ACID compliant', 4),
(6, 3, 'Flexible document / unstructured', 4),

-- Q4: Expertise (Terminal Q - next_question_id IS NULL)
(7, 4, 'JavaScript / Node ecosystem', NULL),
(8, 4, 'Python ecosystem', NULL);

-- Weights (Option -> Tech Item boost)
INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
-- Web App
(1, 1, 3), (1, 4, 4), (1, 6, 3),
-- Data / AI API
(2, 2, 5), (2, 5, 5), (2, 7, 3),
-- Fullstack
(3, 1, 3), (3, 4, 4),
-- Lightweight API
(4, 3, 4), (4, 6, 3),
-- Relational DB
(5, 7, 5),
-- Unstructured DB
(6, 8, 5),
-- JS Expertise
(7, 1, 5), (7, 4, 4), (7, 6, 4),
-- Python Expertise
(8, 2, 5), (8, 5, 5);

-- Reset Sequences to match manually inserted IDs
SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));