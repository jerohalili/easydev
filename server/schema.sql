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
  is_first BOOLEAN DEFAULT FALSE,
  is_multiselect BOOLEAN DEFAULT FALSE
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
  category VARCHAR(50) NOT NULL, -- 'language', 'frontend', 'backend', 'database', 'infrastructure'
  description TEXT,
  trade_offs JSONB
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

-- 8. Custom User-Built Stack Table
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

INSERT INTO tech_items (id, name, category, description, trade_offs) VALUES
(1, 'JavaScript / TypeScript', 'language', 'Industry-standard strongly-typed language for full-stack JavaScript ecosystems.', '{"pros": ["Unified language across frontend and backend", "Massive package ecosystem (npm)"], "cons": ["Single-threaded runtime considerations", "Fast ecosystem churn"]}'),
(2, 'Python', 'language', 'High-level language optimized for AI/ML pipelines, rapid iteration, and backend automation.', '{"pros": ["First-class AI/ML ecosystem (PyTorch, Pandas)", "Readable and expressive syntax"], "cons": ["Slower raw execution speed than compiled languages", "GIL limits multi-core execution"]}'),
(3, 'Go (Golang)', 'language', 'Statically-typed language engineered for concurrent microservices and low-latency cloud infrastructure.', '{"pros": ["Low memory footprint and high performance", "Goroutines simplify massive concurrency"], "cons": ["No classic OOP inheritance", "More boilerplate compared to dynamic languages"]}'),
(4, 'Dart', 'language', 'Client-optimized language tailored for cross-platform UI development with Flutter.', '{"pros": ["Optimized for fast multi-platform UI rendering", "Ahead-Of-Time compiled to native machine code"], "cons": ["Smaller backend ecosystem outside mobile UI"]}'),
(5, 'Java / C#', 'language', 'Enterprise-grade object-oriented systems language with strong static typing and mature tooling.', '{"pros": ["Robust enterprise ecosystem", "High stability and long-term support"], "cons": ["Verbosity requires more setup", "Higher memory overhead than C/Go"]}'),

(10, 'Next.js (React)', 'frontend', 'Production React framework with built-in SSR, SSG, routing, and server components.', '{"pros": ["Superior initial page load speed and SEO", "Seamless server/client component model"], "cons": ["Framework locking risks", "Complex server-side caching rules"]}'),
(11, 'Vite + React (SPA)', 'frontend', 'Lightweight Single Page Application architecture focused on client-side state and instant hot reload.', '{"pros": ["Minimal config and fast local builds", "Simple client-side mental model"], "cons": ["Requires client JS enabled for rendering", "SEO requires extra static rendering strategy"]}'),
(12, 'Astro', 'frontend', 'Content-first web framework delivering near-zero JavaScript by default via Islands Architecture.', '{"pros": ["Unmatched Lighthouse performance scores", "Allows embedding React/Vue components as needed"], "cons": ["Not designed for highly complex dynamic web dashboards"]}'),
(13, 'Flutter (Mobile)', 'frontend', 'Google cross-platform UI toolkit compiling to native iOS and Android binaries from a single codebase.', '{"pros": ["60fps pixel-perfect custom rendering", "Single code implementation for mobile"], "cons": ["Larger initial app bundle size", "Requires platform channels for deep OS native APIs"]}'),
(14, 'React Native (Mobile)', 'frontend', 'Cross-platform mobile framework leveraging native platform components via React primitives.', '{"pros": ["Shares React skills and code logic with web", "Direct access to platform native components"], "cons": ["Bridge overhead for heavy native animations", "Frequent version upgrade friction"]}'),

(20, 'Node.js (Express / NestJS)', 'backend', 'Asynchronous event-driven backend runtime suited for API services and full-stack web platforms.', '{"pros": ["Shared data models with JS/TS frontends", "Massive middleware ecosystem"], "cons": ["CPU-bound computational tasks block event loop"]}'),
(21, 'Python (FastAPI / Django)', 'backend', 'High-performance Python web framework featuring async endpoints and automatic OpenAPI documentation.', '{"pros": ["Native integration with AI/ML services", "Automatic interactive OpenAPI/Swagger docs"], "cons": ["Requires strict async library discipline"]}'),
(22, 'Go (Gin / Fiber)', 'backend', 'Ultra-fast lightweight HTTP web framework engineered for high-concurrency microservices.', '{"pros": ["Blazing fast request throughput and low latency", "Minimal memory consumption per request"], "cons": ["Requires manual handling for complex ORM patterns"]}'),
(23, 'Supabase / Firebase (BaaS)', 'backend', 'Backend-as-a-Service providing real-time data synchronization, managed auth, and direct DB access.', '{"pros": ["Accelerates MVP development by replacing custom backend code", "Built-in auth and live subscriptions"], "cons": ["Vendor lock-in risks", "Custom complex business logic requires serverless functions"]}'),

(30, 'PostgreSQL', 'database', 'ACID-compliant relational database designed for complex relational queries, indexing, and high reliability.', '{"pros": ["Strong data integrity and complex relational support", "Extensible with JSONB, PostGIS, and PGVector"], "cons": ["Requires vertical scaling strategy for massive write traffic"]}'),
(31, 'MongoDB', 'database', 'Document-oriented NoSQL database storing flexible JSON-like schemas for rapidly changing data structures.', '{"pros": ["Schema flexibility for dynamic unstructured data", "Easily horizontal sharding"], "cons": ["Lacks multi-table ACID guarantees without careful setup"]}'),
(32, 'SQLite / Turso', 'database', 'Lightweight embedded or edge-replicated SQL database with zero configuration requirements.', '{"pros": ["Zero server setup cost or maintenance overhead", "Extremely fast local and edge read latency"], "cons": ["Not designed for heavy concurrent write operations"]}'),
(33, 'Redis (In-Memory Cache)', 'database', 'In-memory key-value data store used for high-speed caching, session management, and pub/sub broker queues.', '{"pros": ["Sub-millisecond read/write execution", "Built-in data structures (Lists, Sets, Hashes)"], "cons": ["Data size limited by RAM budget", "Requires persistence configuration for durable storage"]}'),

(40, 'Vercel / Netlify', 'infrastructure', 'Serverless deployment platform built for instant global edge deployment and automated continuous integration.', '{"pros": ["Zero infrastructure management", "Automatic preview deployments per Git branch"], "cons": ["Higher bandwidth cost at massive scale"]}'),
(41, 'Docker + VPS (Hetzner / DigitalOcean)', 'infrastructure', 'Containerized hosting configuration offering cost control and infrastructure portability.', '{"pros": ["Predictable flat monthly compute cost", "Complete control over server environment"], "cons": ["Requires manual OS security patching and server maintenance"]}'),
(42, 'AWS (S3 / ECS / CloudFront)', 'infrastructure', 'Enterprise cloud infrastructure ecosystem capable of supporting arbitrary workload scale.', '{"pros": ["Unlimited horizontal scalability and compliance controls", "Industry standard for production environments"], "cons": ["High configuration complexity and unexpected bill spikes"]}'),
(43, 'Firebase Hosting / Supabase Cloud', 'infrastructure', 'Managed application cloud platform tailored for BaaS-backed mobile and web apps.', '{"pros": ["Tightly integrated with backend auth and database", "Seamless deployment pipeline"], "cons": ["Tied strictly to ecosystem platform services"]}'),

(50, 'No frontend needed', 'frontend', 'This project has no user-facing interface — e.g. a backend API, CLI tool, or automated data pipeline.', '{"pros": ["Nothing to design, build, or maintain on this layer"], "cons": ["Revisit this if the project later grows an admin panel or client UI"]}'),
(51, 'No dedicated backend needed', 'backend', 'This project doesn''t need custom backend logic — e.g. a fully static site, or a frontend talking directly to a BaaS.', '{"pros": ["No server-side code to write, deploy, or maintain"], "cons": ["Revisit this if the project later needs custom business logic or private data access"]}'),
(52, 'No database needed', 'database', 'This project has no persistent data storage requirements.', '{"pros": ["No schema, migrations, or data layer to manage"], "cons": ["Revisit this if the project later needs to persist user or application data"]}');

INSERT INTO questions (id, prompt_text, is_first, is_multiselect) VALUES
(1, 'What primary type of software are you building?', TRUE, FALSE),
(2, 'What platform will your users interact with most?', FALSE, TRUE),
(3, 'What specialized feature or workload does your system need?', FALSE, TRUE),
(4, 'What kind of data storage fits your project requirements?', FALSE, FALSE),
(5, 'What languages or frameworks are you most comfortable with?', FALSE, TRUE),
(6, 'What is your learning bandwidth or setup urgency?', FALSE, FALSE),
(7, 'Where do you plan to deploy and host the application?', FALSE, TRUE),
(8, 'What is your operational budget for infrastructure?', FALSE, FALSE),
(9, 'What is your project timeline and delivery target?', FALSE, FALSE);

INSERT INTO options (id, question_id, label, next_question_id) VALUES
(101, 1, 'Content Site / Blog / Portfolio (Fast static pages, low maintenance)', 2),
(102, 1, 'Full-Stack Web Application (Dashboards, user accounts, interactive tools)', 2),
(103, 1, 'Mobile Application (iOS & Android App)', 2),
(104, 1, 'API / Microservice (Backend logic only, no user-facing UI)', 3),
(105, 1, 'Data / AI / Machine Learning Pipeline (Data processing, ML models, scripts)', 3),
(106, 1, 'I don''t know / Not sure yet (Use neutral web defaults)', 2),

(201, 2, 'Modern Web Browsers (Desktop & Mobile Responsive)', 3),
(202, 2, 'Cross-Platform Mobile Devices (iOS & Android App Stores)', 3),
(203, 2, 'Static Web & Content Delivery Networks (CDN Edge)', 3),
(204, 2, 'I don''t know / Not sure yet', 3),

(301, 3, 'Standard CRUD forms, blogs, and marketing pages', 4),
(302, 3, 'Real-time features (Live chat, instant notifications, WebSockets)', 4),
(303, 3, 'Heavy background jobs, AI inference, or data processing', 4),
(304, 3, 'High-concurrency API handling thousands of requests per second', 4),
(305, 3, 'I don''t know / Not sure yet', 4),
(306, 3, 'No backend logic needed (fully static or client-rendered only)', 4),

(401, 4, 'Structured relational tables (Users, orders, relations)', 5),
(402, 4, 'Flexible JSON documents / unstructured records', 5),
(403, 4, 'Lightweight local database or file-based storage', 5),
(404, 4, 'No database required (Pure static files or external API calls)', 5),
(405, 4, 'I don''t know / Not sure yet', 5),

(501, 5, 'JavaScript / TypeScript', 6),
(502, 5, 'Python', 6),
(503, 5, 'Go / Systems Programming', 6),
(504, 5, 'Dart / Mobile Development', 6),
(505, 5, 'Open to learning anything recommended', 6),
(506, 5, 'Java / C#', 6),
(507, 5, 'I don''t know / Not sure yet', 6),

(601, 6, 'Need fastest possible setup (Minimal boilerplate & config)', 7),
(602, 6, 'Willing to configure custom servers and tools for performance', 7),
(603, 6, 'I don''t know / Not sure yet', 7),

(701, 7, 'Serverless PaaS (Vercel, Netlify, Render)', 8),
(702, 7, 'Containerized VPS (Docker, Hetzner, DigitalOcean)', 8),
(703, 7, 'Managed BaaS / Cloud (Firebase, Supabase)', 8),
(704, 7, 'Enterprise Cloud Infrastructure (AWS, GCP, Azure)', 8),
(705, 7, 'I don''t know / Not sure yet', 8),

(801, 8, 'Strictly free tier or open-source self-hosted', 9),
(802, 8, 'Moderate monthly budget ($10 - $50/mo)', 9),
(803, 8, 'Enterprise budget for production scale', 9),
(804, 8, 'I don''t know / Not sure yet', 9),

(901, 9, 'Quick hackathon / MVP prototype needed in days', NULL),
(902, 9, 'Production system built for long-term maintainability', NULL),
(903, 9, 'I don''t know / Not sure yet', NULL);

INSERT INTO weights (option_id, tech_item_id, weight_value) VALUES
(101, 12, 12), (101, 40, 10), (101, 32, 6),
(102, 1, 8), (102, 10, 10), (102, 20, 8), (102, 30, 8),
(103, 4, 10), (103, 13, 12), (103, 14, 10), (103, 23, 10),
(104, 3, 10), (104, 22, 12), (104, 20, 8), (104, 41, 8), (104, 50, 20),
(105, 2, 12), (105, 21, 12), (105, 30, 8), (105, 41, 8), (105, 50, 20),
(201, 10, 8), (201, 11, 8),
(202, 13, 10), (202, 14, 10), (202, 43, 8),
(203, 12, 10), (203, 40, 10),
(301, 10, 6), (301, 12, 8),
(302, 20, 10), (302, 33, 10), (302, 23, 8),
(303, 2, 10), (303, 21, 10), (303, 41, 8),
(304, 3, 12), (304, 22, 12), (304, 33, 8),
(306, 51, 20),
(401, 30, 12),
(402, 31, 12),
(403, 32, 12),
(404, 52, 20),
(501, 1, 10), (501, 10, 8), (501, 20, 8),
(502, 2, 10), (502, 21, 10),
(503, 3, 10), (503, 22, 10),
(504, 4, 10), (504, 13, 10),
(506, 5, 12), (506, 42, 8),
(601, 10, 6), (601, 12, 8), (601, 23, 10), (601, 40, 10),
(602, 22, 8), (602, 41, 10), (602, 42, 8),
(701, 40, 12),
(702, 41, 12),
(703, 23, 10), (703, 43, 12),
(704, 42, 12), (704, 5, 6),
(801, 32, 8), (801, 40, 8), (801, 41, 8),
(802, 30, 8), (802, 41, 8),
(803, 42, 12), (803, 5, 10),
(901, 12, 8), (901, 23, 10), (901, 40, 10),
(902, 30, 8), (902, 41, 8), (902, 42, 8), (902, 5, 6);

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));
