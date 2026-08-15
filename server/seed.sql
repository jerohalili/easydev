-- Reset database schema data
TRUNCATE TABLE questions, options, tech_items, weights, answers, results CASCADE;

-- 1. Expanded Tech Items (28 items across 5 categories)
INSERT INTO tech_items (id, name, category) VALUES
-- Languages & Runtimes
(1, 'JavaScript / TypeScript', 'language'),
(2, 'Python', 'language'),
(3, 'Go (Golang)', 'language'),
(4, 'Dart', 'language'),
(5, 'Java / C#', 'language'),

-- Frontend & Mobile
(10, 'Next.js (React)', 'frontend'),
(11, 'Vite + React (SPA)', 'frontend'),
(12, 'Astro', 'frontend'),
(13, 'Flutter (Mobile)', 'frontend'),
(14, 'React Native (Mobile)', 'frontend'),

-- Backend
(20, 'Node.js (Express / NestJS)', 'backend'),
(21, 'Python (FastAPI / Django)', 'backend'),
(22, 'Go (Gin / Fiber)', 'backend'),
(23, 'Supabase / Firebase (BaaS)', 'backend'),

-- Databases & Storage
(30, 'PostgreSQL', 'database'),
(31, 'MongoDB', 'database'),
(32, 'SQLite / Turso', 'database'),
(33, 'Redis (In-Memory Cache)', 'database'),

-- Cloud & Infrastructure
(40, 'Vercel / Netlify', 'infrastructure'),
(41, 'Docker + VPS (Hetzner / DigitalOcean)', 'infrastructure'),
(42, 'AWS (S3 / ECS / CloudFront)', 'infrastructure'),
(43, 'Firebase Hosting / Supabase Cloud', 'infrastructure');

-- 2. Questions (9-Step Branching Flow)
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

-- 3. Options
INSERT INTO options (id, question_id, label, next_question_id) VALUES
-- Q1: Software Type
(101, 1, 'Content Site / Blog / Portfolio (Fast static pages, low maintenance)', 2),
(102, 1, 'Full-Stack Web Application (Dashboards, user accounts, interactive tools)', 2),
(103, 1, 'Mobile Application (iOS & Android App)', 2),
(104, 1, 'API / Microservice (Backend logic only, no user-facing UI)', 3), -- Skips Q2 (Platform)
(105, 1, 'Data / AI / Machine Learning Pipeline (Data processing, ML models, scripts)', 3), -- Skips Q2

-- Q2: Target Platform
(201, 2, 'Modern Web Browsers (Desktop & Mobile Responsive)', 3),
(202, 2, 'Cross-Platform Mobile Devices (iOS & Android App Stores)', 3),
(203, 2, 'Static Web & Content Delivery Networks (CDN Edge)', 3),

-- Q3: Special Feature Workload
(301, 3, 'Standard CRUD forms, blogs, and marketing pages', 4),
(302, 3, 'Real-time features (Live chat, instant notifications, WebSockets)', 4),
(303, 3, 'Heavy background jobs, AI inference, or data processing', 4),
(304, 3, 'High-concurrency API handling thousands of requests per second', 4),

-- Q4: Data Storage
(401, 4, 'Structured relational tables (Users, orders, relations)', 5),
(402, 4, 'Flexible JSON documents / unstructured records', 5),
(403, 4, 'Lightweight local database or file-based storage', 5),
(404, 4, 'No database required (Pure static files or external API calls)', 5),

-- Q5: Team Expertise
(501, 5, 'JavaScript / TypeScript', 6),
(502, 5, 'Python', 6),
(503, 5, 'Go / Systems Programming', 6),
(504, 5, 'Dart / Mobile Development', 6),
(505, 5, 'Open to learning anything recommended', 6),

-- Q6: Setup Urgency
(601, 6, 'Need fastest possible setup (Minimal boilerplate & config)', 7),
(602, 6, 'Willing to configure custom servers and tools for performance', 7),

-- Q7: Deployment Platform
(701, 7, 'Serverless PaaS (Vercel, Netlify, Render)', 8),
(702, 7, 'Containerized VPS (Docker, Hetzner, DigitalOcean)', 8),
(703, 7, 'Managed BaaS / Cloud (Firebase, Supabase)', 8),
(704, 7, 'Enterprise Cloud Infrastructure (AWS, GCP, Azure)', 8),

-- Q8: Budget
(801, 8, 'Strictly free tier or open-source self-hosted', 9),
(802, 8, 'Moderate monthly budget ($10 - $50/mo)', 9),
(803, 8, 'Enterprise budget for production scale', 9),

-- Q9: Timeline (Terminal)
(901, 9, 'Quick hackathon / MVP prototype needed in days', NULL),
(902, 9, 'Production system built for long-term maintainability', NULL);

-- 4. Weights Matrix (Option -> Tech Item -> Weight)
INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
-- Q1: Software Type
(101, 12, 12), (101, 40, 10), (101, 32, 6),                     -- Content: Astro + Vercel + SQLite
(102, 1, 8), (102, 10, 10), (102, 20, 8), (102, 30, 8),         -- Web App: TS + Next.js + Node + Postgres
(103, 4, 10), (103, 13, 12), (103, 14, 10), (103, 23, 10),       -- Mobile: Dart + Flutter/RN + Supabase
(104, 3, 10), (104, 22, 12), (104, 20, 8), (104, 41, 8),        -- API: Go + Go Fiber/Node + Docker
(105, 2, 12), (105, 21, 12), (105, 30, 8), (105, 41, 8),        -- Data/AI: Python + FastAPI + Postgres

-- Q2: Target Platform
(201, 10, 8), (201, 11, 8),
(202, 13, 10), (202, 14, 10), (202, 43, 8),
(203, 12, 10), (203, 40, 10),

-- Q3: Special Features
(301, 10, 6), (301, 12, 8),
(302, 20, 10), (302, 33, 10), (302, 23, 8),                     -- Realtime: Node + Redis + Supabase
(303, 2, 10), (303, 21, 10), (303, 41, 8),                       -- AI/Jobs: Python + FastAPI + Docker
(304, 3, 12), (304, 22, 12), (304, 33, 8),                       -- High-concurrency: Go + Fiber + Redis

-- Q4: Data Storage
(401, 30, 12),                                                  -- Postgres
(402, 31, 12),                                                  -- MongoDB
(403, 32, 12),                                                  -- SQLite
-- Option 404 (No DB) deliberately adds 0 weight to databases so DB tier is omitted!

-- Q5: Team Expertise
(501, 1, 10), (501, 10, 8), (501, 20, 8),
(502, 2, 10), (502, 21, 10),
(503, 3, 10), (503, 22, 10),
(504, 4, 10), (504, 13, 10),

-- Q6: Urgency & Flexibility
(601, 10, 6), (601, 12, 8), (601, 23, 10), (601, 40, 10),       -- Rapid setup: Astro, BaaS, Vercel
(602, 22, 8), (602, 41, 10), (602, 42, 8),                      -- Custom servers: Go, Docker, AWS

-- Q7: Deployment Platform
(701, 40, 12),
(702, 41, 12),
(703, 23, 10), (703, 43, 12),
(704, 42, 12),

-- Q8: Budget
(801, 32, 8), (801, 40, 8), (801, 41, 8),
(802, 30, 8), (802, 41, 8),
(803, 42, 12),

-- Q9: Timeline
(901, 12, 8), (901, 23, 10), (901, 40, 10),
(902, 30, 8), (902, 41, 8), (902, 42, 8);

-- Reset Sequences
SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));