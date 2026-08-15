-- server/schema.sql
DROP TABLE IF EXISTS user_stacks CASCADE;
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

-- 3. Options Table
CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  next_question_id INT REFERENCES questions(id) ON DELETE SET NULL
);

-- 4. Tech Items Table
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

-- 7. Recommended Results Table
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  tech_item_id INT REFERENCES tech_items(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  reasoning_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Custom User-Built Stack Table (For Side-by-Side Comparison)
CREATE TABLE user_stacks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  tech_item_id INT REFERENCES tech_items(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, category)
);

-- ========================================================
-- SEED DATA
-- ========================================================

INSERT INTO tech_items (id, name, category) VALUES
(1, 'JavaScript / TypeScript', 'language'),
(2, 'Python', 'language'),
(3, 'Go (Golang)', 'language'),
(4, 'Dart', 'language'),
(5, 'Java / C#', 'language'),
(10, 'Next.js (React)', 'frontend'),
(11, 'Vite + React (SPA)', 'frontend'),
(12, 'Astro', 'frontend'),
(13, 'Flutter (Mobile)', 'frontend'),
(14, 'React Native (Mobile)', 'frontend'),
(20, 'Node.js (Express / NestJS)', 'backend'),
(21, 'Python (FastAPI / Django)', 'backend'),
(22, 'Go (Gin / Fiber)', 'backend'),
(23, 'Supabase / Firebase (BaaS)', 'backend'),
(30, 'PostgreSQL', 'database'),
(31, 'MongoDB', 'database'),
(32, 'SQLite / Turso', 'database'),
(33, 'Redis (In-Memory Cache)', 'database'),
(40, 'Vercel / Netlify', 'infrastructure'),
(41, 'Docker + VPS (Hetzner / DigitalOcean)', 'infrastructure'),
(42, 'AWS (S3 / ECS / CloudFront)', 'infrastructure'),
(43, 'Firebase Hosting / Supabase Cloud', 'infrastructure');

INSERT INTO questions (id, prompt_text, is_first) VALUES
(1, 'What primary type of software are you building?', TRUE),
(2, 'What platform will your users interact with most?', FALSE),
(3, 'What specialized feature or workload does your system need?', FALSE),
(4, 'What kind of data storage fits your project requirements?', FALSE),
(5, 'What languages or frameworks is your team most comfortable with?', FALSE),
(6, 'What is your team learning bandwidth or setup urgency?', FALSE),
(7, 'Where do you plan to deploy and host the application?', FALSE),
(8, 'What is your operational budget for infrastructure?', FALSE),
(9, 'What is your project timeline and delivery target?', FALSE);

INSERT INTO options (id, question_id, label, next_question_id) VALUES
-- Q1: Software Type (106 is explicit neutral routing to Q2)
(101, 1, 'Content Site / Blog / Portfolio (Fast static pages, low maintenance)', 2),
(102, 1, 'Full-Stack Web Application (Dashboards, user accounts, interactive tools)', 2),
(103, 1, 'Mobile Application (iOS & Android App)', 2),
(104, 1, 'API / Microservice (Backend logic only, no user-facing UI)', 3),
(105, 1, 'Data / AI / Machine Learning Pipeline (Data processing, ML models, scripts)', 3),
(106, 1, 'I don''t know / Not sure yet (Use neutral web defaults)', 2),

-- Q2: Target Platform
(201, 2, 'Modern Web Browsers (Desktop & Mobile Responsive)', 3),
(202, 2, 'Cross-Platform Mobile Devices (iOS & Android App Stores)', 3),
(203, 2, 'Static Web & Content Delivery Networks (CDN Edge)', 3),
(204, 2, 'I don''t know / Not sure yet', 3),

-- Q3: Special Feature Workload
(301, 3, 'Standard CRUD forms, blogs, and marketing pages', 4),
(302, 3, 'Real-time features (Live chat, instant notifications, WebSockets)', 4),
(303, 3, 'Heavy background jobs, AI inference, or data processing', 4),
(304, 3, 'High-concurrency API handling thousands of requests per second', 4),
(305, 3, 'I don''t know / Not sure yet', 4),

-- Q4: Data Storage
(401, 4, 'Structured relational tables (Users, orders, relations)', 5),
(402, 4, 'Flexible JSON documents / unstructured records', 5),
(403, 4, 'Lightweight local database or file-based storage', 5),
(404, 4, 'No database required (Pure static files or external API calls)', 5),
(405, 4, 'I don''t know / Not sure yet', 5),

-- Q5: Team Expertise
(501, 5, 'JavaScript / TypeScript', 6),
(502, 5, 'Python', 6),
(503, 5, 'Go / Systems Programming', 6),
(504, 5, 'Dart / Mobile Development', 6),
(505, 5, 'Open to learning anything recommended', 6),
(506, 5, 'I don''t know / Not sure yet', 6),

-- Q6: Urgency & Flexibility
(601, 6, 'Need fastest possible setup (Minimal boilerplate & config)', 7),
(602, 6, 'Willing to configure custom servers and tools for performance', 7),
(603, 6, 'I don''t know / Not sure yet', 7),

-- Q7: Deployment Platform
(701, 7, 'Serverless PaaS (Vercel, Netlify, Render)', 8),
(702, 7, 'Containerized VPS (Docker, Hetzner, DigitalOcean)', 8),
(703, 7, 'Managed BaaS / Cloud (Firebase, Supabase)', 8),
(704, 7, 'Enterprise Cloud Infrastructure (AWS, GCP, Azure)', 8),
(705, 7, 'I don''t know / Not sure yet', 8),

-- Q8: Budget
(801, 8, 'Strictly free tier or open-source self-hosted', 9),
(802, 8, 'Moderate monthly budget ($10 - $50/mo)', 9),
(803, 8, 'Enterprise budget for production scale', 9),
(804, 8, 'I don''t know / Not sure yet', 9),

-- Q9: Timeline
(901, 9, 'Quick hackathon / MVP prototype needed in days', NULL),
(902, 9, 'Production system built for long-term maintainability', NULL),
(903, 9, 'I don''t know / Not sure yet', NULL);

INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
(101, 12, 12), (101, 40, 10), (101, 32, 6),
(102, 1, 8), (102, 10, 10), (102, 20, 8), (102, 30, 8),
(103, 4, 10), (103, 13, 12), (103, 14, 10), (103, 23, 10),
(104, 3, 10), (104, 22, 12), (104, 20, 8), (104, 41, 8),
(105, 2, 12), (105, 21, 12), (105, 30, 8), (105, 41, 8),
(201, 10, 8), (201, 11, 8),
(202, 13, 10), (202, 14, 10), (202, 43, 8),
(203, 12, 10), (203, 40, 10),
(301, 10, 6), (301, 12, 8),
(302, 20, 10), (302, 33, 10), (302, 23, 8),
(303, 2, 10), (303, 21, 10), (303, 41, 8),
(304, 3, 12), (304, 22, 12), (304, 33, 8),
(401, 30, 12),
(402, 31, 12),
(403, 32, 12),
(501, 1, 10), (501, 10, 8), (501, 20, 8),
(502, 2, 10), (502, 21, 10),
(503, 3, 10), (503, 22, 10),
(504, 4, 10), (504, 13, 10),
(601, 10, 6), (601, 12, 8), (601, 23, 10), (601, 40, 10),
(602, 22, 8), (602, 41, 10), (602, 42, 8),
(701, 40, 12),
(702, 41, 12),
(703, 23, 10), (703, 43, 12),
(704, 42, 12),
(801, 32, 8), (801, 40, 8), (801, 41, 8),
(802, 30, 8), (802, 41, 8),
(803, 42, 12),
(901, 12, 8), (901, 23, 10), (901, 40, 10),
(902, 30, 8), (902, 41, 8), (902, 42, 8);

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));