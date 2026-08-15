-- 1. Insert/Update Questions with Junior-Friendly Language
TRUNCATE TABLE questions, options, tech_items, weights, answers, results CASCADE;

INSERT INTO tech_items (id, name, category) VALUES
  -- Languages & Runtimes
  (1, 'JavaScript / TypeScript', 'language'),
  (2, 'Python', 'language'),
  (3, 'Go (Golang)', 'language'),
  -- Frontend
  (10, 'Next.js (React)', 'frontend'),
  (11, 'Vite + React (SPA)', 'frontend'),
  (12, 'Astro', 'frontend'),
  -- Backend
  (20, 'Node.js (Express / Fastify)', 'backend'),
  (21, 'Python (FastAPI)', 'backend'),
  (22, 'Go (Gin / Fiber)', 'backend'),
  -- Database
  (30, 'PostgreSQL', 'database'),
  (31, 'MongoDB', 'database'),
  (32, 'SQLite / Turso', 'database'),
  -- Infrastructure
  (40, 'Vercel / Netlify', 'infrastructure'),
  (41, 'Docker + VPS (Hetzner / DigitalOcean)', 'infrastructure'),
  (42, 'AWS (S3 / ECS / CloudFront)', 'infrastructure');

-- Question 1: Project Scope
INSERT INTO questions (id, prompt_text, is_first) VALUES
(1, 'What primary type of application are you building? (e.g., standard website vs data-heavy app)', TRUE);

INSERT INTO options (id, question_id, label, next_question_id) VALUES
(101, 1, 'Content site / Blog / Portfolio (Fast page loads, simple data)', 2),
(102, 1, 'Data / AI / Analytics Service (Processing data, machine learning, background jobs)', 2),
(103, 1, 'High-Performance Microservice / API (Needs high speed & concurrent requests)', 2),
(104, 1, 'Full-Stack Web App (User logins, dashboards, live updates)', 2);

-- Question 2: Team Experience & Speed
INSERT INTO questions (id, prompt_text, is_first) VALUES
(2, 'How quickly do you need to ship, and what is your team background?', FALSE);

INSERT INTO options (id, question_id, label, next_question_id) VALUES
(201, 2, 'Rapid MVP / Hackathon (Want fastest setup with minimal config)', NULL),
(202, 2, 'Standard Web Stack (Familiar with JavaScript/TypeScript)', NULL),
(203, 2, 'Data Science / AI First (Familiar with Python scripts and models)', NULL),
(204, 2, 'Lightweight & Low Cost (Minimal server overhead or local embedded database)', NULL);

-- Seed Weights to Ensure Varied Outputs Based on Selections
INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
-- Content site / Blog
(101, 12, 10), -- Astro
(101, 11, 5),  -- Vite React
(101, 32, 8),  -- SQLite
(101, 40, 10), -- Vercel

-- Data / AI Service
(102, 2, 12),  -- Python
(102, 21, 12), -- FastAPI
(102, 30, 8),  -- Postgres
(102, 41, 8),  -- Docker

-- High-Performance Microservice
(103, 3, 12),  -- Go
(103, 22, 12), -- Go Fiber
(103, 30, 9),  -- Postgres
(103, 41, 10), -- Docker + VPS

-- Full-Stack Web App
(104, 1, 10),  -- TS
(104, 10, 10), -- Next.js
(104, 20, 8),  -- Express
(104, 30, 10), -- Postgres
(104, 40, 8),  -- Vercel

-- Rapid MVP
(201, 10, 8),  -- Next.js
(201, 40, 10), -- Vercel
(201, 32, 6),  -- SQLite

-- Standard JS/TS
(202, 1, 10),  -- TS
(202, 10, 8),  -- Next.js
(202, 20, 8),  -- Node Express

-- Data Science / AI First
(203, 2, 12),  -- Python
(203, 21, 12), -- FastAPI
(203, 31, 6),  -- MongoDB

-- Lightweight / Low Cost
(204, 12, 10), -- Astro
(204, 32, 10), -- SQLite
(204, 40, 8);  -- Vercel