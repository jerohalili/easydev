-- Drop existing tables for clean re-runs
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS weights CASCADE;
DROP TABLE IF EXISTS tech_items CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Projects Table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Questions Table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  is_first BOOLEAN DEFAULT FALSE
);

-- 3. Options Table (Branching: next_question_id = NULL means terminal question)
CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  next_question_id INT REFERENCES questions(id) ON DELETE SET NULL
);

-- 4. Tech Items Table (5 Categories)
CREATE TABLE tech_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL -- 'language', 'frontend', 'backend', 'database', 'infrastructure'
);

-- 5. Weights Matrix
CREATE TABLE weights (
  id SERIAL PRIMARY KEY,
  option_id INT REFERENCES options(id) ON DELETE CASCADE,
  tech_item_id INT REFERENCES tech_items(id) ON DELETE CASCADE,
  weight_value INT NOT NULL
);

-- 6. User Answers Table
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  option_id INT REFERENCES options(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Results History Table
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
-- SEED DATA
-- ========================================================

-- Tech Items (27 items across 5 categories)
INSERT INTO tech_items (id, name, category) VALUES
-- Languages
(1, 'JavaScript / TypeScript', 'language'),
(2, 'Python', 'language'),
(3, 'Java', 'language'),
(4, 'C#', 'language'),
(5, 'Go (Golang)', 'language'),
(6, 'Rust', 'language'),

-- Frontend Frameworks & Libraries
(7, 'React', 'frontend'),
(8, 'Next.js', 'frontend'),
(9, 'Vue.js', 'frontend'),
(10, 'Angular', 'frontend'),
(11, 'Tailwind CSS', 'frontend'),

-- Backend Frameworks
(12, 'Node.js (Express / NestJS)', 'backend'),
(13, 'Spring Boot', 'backend'),
(14, 'Django / FastAPI', 'backend'),
(15, 'ASP.NET Core', 'backend'),
(16, 'Ruby on Rails', 'backend'),

-- Databases & Storage
(17, 'PostgreSQL', 'database'),
(18, 'MongoDB', 'database'),
(19, 'MySQL', 'database'),
(20, 'Redis', 'database'),
(21, 'Snowflake / BigQuery', 'database'),

-- Cloud & DevOps Infrastructure
(22, 'AWS (Amazon Web Services)', 'infrastructure'),
(23, 'Docker', 'infrastructure'),
(24, 'Kubernetes', 'infrastructure'),
(25, 'Terraform', 'infrastructure'),
(26, 'GitHub Actions', 'infrastructure');

-- Questions (9 Questions Flow)
INSERT INTO questions (id, prompt_text, is_first) VALUES
(1, 'What are you building?', TRUE),
(2, 'What special features do you need?', FALSE),
(3, 'How many active users do you expect?', FALSE),
(4, 'What kind of data will your system handle?', FALSE),
(5, 'What programming languages does your team already know?', FALSE),
(6, 'Do you have time for team training or learning new tools?', FALSE),
(7, 'Where do you plan to run and host the application?', FALSE),
(8, 'What is your budget structure for software and infrastructure?', FALSE),
(9, 'How fast do you need a working version launched?', FALSE);

-- Options with Branching
INSERT INTO options (id, question_id, label, next_question_id) VALUES
-- Q1: Building target (Option 4 'API' branches straight to Q3, skipping frontend Q2)
(1, 1, 'Website or Web Application', 2),
(2, 1, 'Mobile Application', 2),
(3, 1, 'E-commerce / Online Store', 2),
(4, 1, 'An API / Backend Microservice', 3),

-- Q2: Special Features
(5, 2, 'Real-time chat or live web-socket notifications', 3),
(6, 2, 'Video streaming & high-resolution media handling', 3),
(7, 2, 'Fast full-text search & indexing tools', 3),
(8, 2, 'Standard CRUD workflows, forms, and landing pages', 3),

-- Q3: Scale & Users
(9, 3, 'A few hundred to thousands of users (Prototype / Small scale)', 4),
(10, 3, 'Tens of thousands to hundreds of thousands of users', 4),
(11, 3, 'Millions of active visitors (High Scale / Enterprise)', 4),

-- Q4: Data Nature
(12, 4, 'Simple user profiles & structured relational tables', 5),
(13, 4, 'Flexible JSON documents / unstructured data', 5),
(14, 4, 'Heavy media files, massive logs, or analytical data', 5),

-- Q5: Team Expertise
(15, 5, 'JavaScript / TypeScript', 6),
(16, 5, 'Python', 6),
(17, 5, 'Java or C#', 6),
(18, 5, 'Go or Rust', 6),
(19, 5, 'Open to learning anything required', 6),

-- Q6: Training Time
(20, 6, 'Must use familiar tech to save time (No training time)', 7),
(21, 6, 'Team can quickly learn new frameworks or paradigms', 7),

-- Q7: Hosting Platform
(22, 7, 'Cloud providers (AWS, Google Cloud, Azure)', 8),
(23, 7, 'Containerized platform (Docker / Kubernetes)', 8),
(24, 7, 'Simple serverless or PaaS hosting (Vercel, Render)', 8),

-- Q8: Budget
(25, 8, 'Strictly free, open-source, or minimal tier tools', 9),
(26, 8, 'Moderate production cloud budget', 9),
(27, 8, 'Enterprise budget for paid managed services', 9),

-- Q9: Timeline (Terminal Question)
(28, 9, 'Quick prototype / MVP needed in a few weeks', NULL),
(29, 9, 'Stable system built for long-term production use', NULL);

-- Hand-assigned Weights Matrix (Option ID -> Tech Item ID -> Weight)
INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
-- Q1
(1, 1, 4), (1, 7, 5), (1, 8, 4), (1, 11, 4), (1, 12, 3), -- Web
(2, 1, 3), (2, 7, 4), (2, 12, 3),                       -- Mobile
(3, 1, 4), (3, 8, 4), (3, 12, 3), (3, 17, 4),           -- E-commerce
(4, 5, 5), (4, 6, 4), (4, 12, 3), (4, 14, 4), (4, 23, 4), -- API Only

-- Q2
(5, 1, 3), (5, 12, 5), (5, 20, 5),                      -- Real-time chat (Node + Redis)
(6, 22, 5), (6, 23, 4), (6, 20, 3),                     -- Video streaming (AWS + Redis)
(7, 17, 4), (7, 20, 4), (7, 21, 3),                     -- Search (Postgres + Redis)
(8, 7, 3), (8, 11, 4), (8, 16, 4),                      -- Standard CRUD (Tailwind + Rails)

-- Q3
(9, 8, 3), (9, 12, 3), (9, 26, 4),                      -- Small scale (GitHub Actions)
(10, 17, 4), (10, 22, 4), (10, 23, 4),                   -- Medium scale (AWS + Docker)
(11, 5, 5), (11, 6, 5), (11, 13, 4), (11, 17, 4), (11, 24, 5), (11, 25, 5), -- High scale (Go, Rust, K8s, Terraform)

-- Q4
(12, 17, 5), (12, 19, 4),                               -- Relational
(13, 18, 5),                                            -- MongoDB
(14, 21, 5), (14, 22, 4), (14, 25, 4),                   -- Snowflake / BigQuery

-- Q5
(15, 1, 5), (15, 7, 4), (15, 8, 4), (15, 12, 5),        -- JS/TS
(16, 2, 5), (16, 14, 5),                                -- Python / FastAPI
(17, 3, 5), (17, 4, 5), (17, 13, 5), (17, 15, 5),        -- Java/C#
(18, 5, 5), (18, 6, 5),                                 -- Go/Rust
(19, 1, 2), (19, 2, 2), (19, 7, 2),                     -- Open

-- Q6
(20, 1, 3), (20, 12, 3), (20, 16, 4),                   -- Familiar tools
(21, 5, 3), (21, 6, 3), (21, 8, 3),                     -- Learning bandwidth

-- Q7
(22, 22, 5),                                            -- AWS
(23, 23, 5), (23, 24, 4),                               -- Docker / K8s
(24, 8, 4), (24, 12, 3),                                -- PaaS/Serverless

-- Q8
(25, 17, 3), (25, 19, 3), (25, 23, 3), (25, 26, 4),     -- Free/Open source
(26, 22, 3), (26, 23, 3),                               -- Moderate budget
(27, 21, 4), (27, 22, 5), (27, 24, 4), (27, 25, 4),     -- Enterprise budget

-- Q9
(28, 8, 4), (28, 11, 4), (28, 12, 3), (28, 16, 5),      -- Quick MVP (Next.js, Rails, Node)
(29, 1, 3), (29, 3, 4), (29, 13, 4), (29, 17, 5), (29, 25, 4); -- Long term (Postgres, Spring Boot, Terraform)

-- Reset ID Sequences
SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));