-- ========================================================
-- TABLE DEFINITIONS
-- ========================================================
-- NOTE: these CREATE TABLE statements were missing from the original
-- schema.sql (it only contained seed INSERTs), even though the README
-- instructs `psql "$DATABASE_URL" -f server/schema.sql` as the full setup
-- step. Restored here, inferred from the columns actually referenced across
-- api/index.js, so a fresh clone can be set up from this file alone.

CREATE TABLE IF NOT EXISTS tech_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  trade_offs JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  is_first BOOLEAN NOT NULL DEFAULT FALSE,
  is_multiselect BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id),
  label TEXT NOT NULL,
  next_question_id INT REFERENCES questions(id),
  -- Marks this option as the question's "I don't know / Not sure yet" choice.
  -- Added so the client can enforce mutual exclusivity in multi-select
  -- questions (selecting "I don't know" alongside a real answer is a
  -- contradiction the UI should prevent, not silently allow) instead of
  -- relying on fragile string-matching against the label text.
  is_unsure BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS weights (
  id SERIAL PRIMARY KEY,
  option_id INT NOT NULL REFERENCES options(id),
  tech_item_id INT NOT NULL REFERENCES tech_items(id),
  weight_value INT NOT NULL,
  UNIQUE (option_id, tech_item_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT NOT NULL DEFAULT '',
  -- Self-reported background, captured once via the first question in the
  -- flow (id 99). Used only to simplify the questionnaire for beginners
  -- (see AUTO_ANSWER_FOR_BEGINNERS in api/index.js) -- it is never used as a
  -- scoring signal for the tech-stack recommendation itself.
  experience_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id),
  option_id INT NOT NULL REFERENCES options(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tech_item_id INT NOT NULL REFERENCES tech_items(id),
  category TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  reasoning_text TEXT,
  -- TRUE when this pick was a low-confidence "no layer needed" result -- the
  -- margin over the runner-up tech in that category was too thin to commit
  -- to silently. The client shows this as a question to confirm rather than
  -- a stated fact. See CONFIDENCE_MARGIN_THRESHOLD in api/index.js.
  needs_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stacks (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  tech_item_id INT NOT NULL REFERENCES tech_items(id),
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (project_id, category)
);

-- Idempotent column additions, in case this file is re-run against a
-- database that was already seeded from an earlier version of this schema.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE options ADD COLUMN IF NOT EXISTS is_unsure BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE results ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN NOT NULL DEFAULT FALSE;

-- ========================================================
-- SEED DATA
-- ========================================================

INSERT INTO tech_items (id, name, category, description, trade_offs) VALUES
(1, 'JavaScript / TypeScript', 'language', 'Industry-standard strongly-typed language for full-stack JavaScript ecosystems.', '{"pros": ["Unified language across frontend and backend", "Massive package ecosystem (npm)"], "cons": ["Single-threaded runtime considerations", "Fast ecosystem churn"]}'),
(2, 'Python', 'language', 'High-level language optimized for AI/ML pipelines, rapid iteration, and backend automation.', '{"pros": ["First-class AI/ML ecosystem (PyTorch, Pandas)", "Readable and expressive syntax"], "cons": ["Slower raw execution speed than compiled languages", "GIL limits multi-core execution"]}'),
(3, 'Go (Golang)', 'language', 'Statically-typed language engineered for concurrent microservices and low-latency cloud infrastructure.', '{"pros": ["Low memory footprint and high performance", "Goroutines simplify massive concurrency"], "cons": ["No classic OOP inheritance", "More boilerplate compared to dynamic languages"]}'),
(4, 'Dart', 'language', 'Client-optimized language tailored for cross-platform UI development with Flutter.', '{"pros": ["Optimized for fast multi-platform UI rendering", "Ahead-Of-Time compiled to native machine code"], "cons": ["Smaller backend ecosystem outside mobile UI"]}'),
(5, 'Java / C#', 'language', 'Enterprise-grade object-oriented systems language with strong static typing and mature tooling.', '{"pros": ["Robust enterprise ecosystem", "High stability and long-term support"], "cons": ["Verbosity requires more setup", "Higher memory overhead than C/Go"]}'),
(6, 'PHP', 'language', 'Long-established server-side language purpose-built for the web, powering a large share of existing sites.', '{"pros": ["Runs almost anywhere for very low hosting cost", "Huge base of existing hosting, tutorials, and CMS integrations"], "cons": ["Inconsistent standard library conventions from its long history", "Perceived as less modern for greenfield API-first projects"]}'),
(7, 'Ruby', 'language', 'Expressive, developer-happiness-focused language best known as the foundation of Ruby on Rails.', '{"pros": ["Extremely readable, concise syntax", "Rails convention-over-configuration accelerates CRUD-heavy apps"], "cons": ["Slower raw execution than compiled languages", "Smaller hiring pool than JS/Python in most markets"]}'),
(8, 'Rust', 'language', 'Systems language offering memory safety without a garbage collector, for performance-critical or reliability-critical work.', '{"pros": ["Memory safety guaranteed at compile time, no GC pauses", "Near-C++ performance with modern tooling"], "cons": ["Steepest learning curve of any option here", "Slower iteration speed for simple CRUD work"]}'),

(10, 'Next.js (React)', 'frontend', 'Production React framework with built-in SSR, SSG, routing, and server components.', '{"pros": ["Superior initial page load speed and SEO", "Seamless server/client component model"], "cons": ["Framework locking risks", "Complex server-side caching rules"]}'),
(11, 'Vite + React (SPA)', 'frontend', 'Lightweight Single Page Application architecture focused on client-side state and instant hot reload.', '{"pros": ["Minimal config and fast local builds", "Simple client-side mental model"], "cons": ["Requires client JS enabled for rendering", "SEO requires extra static rendering strategy"]}'),
(12, 'Astro', 'frontend', 'Content-first web framework delivering near-zero JavaScript by default via Islands Architecture.', '{"pros": ["Unmatched Lighthouse performance scores", "Allows embedding React/Vue components as needed"], "cons": ["Not designed for highly complex dynamic web dashboards"]}'),
(13, 'Flutter (Mobile)', 'frontend', 'Google cross-platform UI toolkit compiling to native iOS and Android binaries from a single codebase.', '{"pros": ["60fps pixel-perfect custom rendering", "Single code implementation for mobile"], "cons": ["Larger initial app bundle size", "Requires platform channels for deep OS native APIs"]}'),
(14, 'React Native (Mobile)', 'frontend', 'Cross-platform mobile framework leveraging native platform components via React primitives.', '{"pros": ["Shares React skills and code logic with web", "Direct access to platform native components"], "cons": ["Bridge overhead for heavy native animations", "Frequent version upgrade friction"]}'),
(15, 'Vue.js (Nuxt)', 'frontend', 'Approachable, gently-curved-learning-curve framework combining template syntax with a reactive component model.', '{"pros": ["Very gradual learning curve compared to React", "Nuxt gives SSR/SSG out of the box similarly to Next.js"], "cons": ["Smaller job market and package ecosystem than React"]}'),
(16, 'Svelte (SvelteKit)', 'frontend', 'Compiler-based framework that ships almost no runtime framework code to the browser.', '{"pros": ["Smallest bundle sizes and fastest runtime performance", "Less boilerplate than React or Vue for the same UI"], "cons": ["Smallest ecosystem and hiring pool of the major frameworks"]}'),
(17, 'Angular', 'frontend', 'Full, opinionated framework with built-in dependency injection, routing, and forms, popular in enterprise teams.', '{"pros": ["Batteries-included: routing, forms, DI all built in", "Strong fit for large teams needing enforced structure"], "cons": ["Steepest learning curve of the mainstream frontend frameworks", "More boilerplate for small/simple projects"]}'),
(18, 'Plain HTML / CSS / JavaScript', 'frontend', 'No framework at all — hand-written markup, styles, and vanilla JS.', '{"pros": ["Zero build tooling or framework version churn", "Loads instantly, nothing to learn beyond the web platform itself"], "cons": ["Manual DOM work becomes painful once the UI gets complex or stateful"]}'),

(20, 'Node.js (Express / NestJS)', 'backend', 'Asynchronous event-driven backend runtime suited for API services and full-stack web platforms.', '{"pros": ["Shared data models with JS/TS frontends", "Massive middleware ecosystem"], "cons": ["CPU-bound computational tasks block event loop"]}'),
(21, 'Python (FastAPI / Django)', 'backend', 'High-performance Python web framework featuring async endpoints and automatic OpenAPI documentation.', '{"pros": ["Native integration with AI/ML services", "Automatic interactive OpenAPI/Swagger docs"], "cons": ["Requires strict async library discipline"]}'),
(22, 'Go (Gin / Fiber)', 'backend', 'Ultra-fast lightweight HTTP web framework engineered for high-concurrency microservices.', '{"pros": ["Blazing fast request throughput and low latency", "Minimal memory consumption per request"], "cons": ["Requires manual handling for complex ORM patterns"]}'),
(23, 'Supabase / Firebase (BaaS)', 'backend', 'Backend-as-a-Service providing real-time data synchronization, managed auth, and direct DB access.', '{"pros": ["Accelerates MVP development by replacing custom backend code", "Built-in auth and live subscriptions"], "cons": ["Vendor lock-in risks", "Custom complex business logic requires serverless functions"]}'),
(24, 'Ruby on Rails', 'backend', 'Convention-over-configuration web framework optimized for building CRUD-heavy applications fast.', '{"pros": ["Extremely fast to scaffold a full working app", "Mature, batteries-included ecosystem (ActiveRecord, ActionMailer, etc.)"], "cons": ["Convention-heavy — fighting the framework is painful when you need to deviate"]}'),
(25, 'Java Spring Boot / ASP.NET', 'backend', 'Strongly-typed, enterprise-grade backend frameworks with mature dependency injection and tooling.', '{"pros": ["Battle-tested for large, long-lived enterprise codebases", "Strong tooling, refactoring support, and static guarantees"], "cons": ["More verbose and slower to iterate on for small projects"]}'),
(26, 'Laravel (PHP)', 'backend', 'Batteries-included PHP framework covering routing, ORM, auth, and queues out of the box.', '{"pros": ["Extremely fast setup for standard web-app CRUD patterns", "Runs on the huge, cheap base of existing PHP hosting"], "cons": ["Less common choice for API-first or greenfield modern stacks"]}'),

(30, 'PostgreSQL', 'database', 'ACID-compliant relational database designed for complex relational queries, indexing, and high reliability.', '{"pros": ["Strong data integrity and complex relational support", "Extensible with JSONB, PostGIS, and PGVector"], "cons": ["Requires vertical scaling strategy for massive write traffic"]}'),
(31, 'MongoDB', 'database', 'Document-oriented NoSQL database storing flexible JSON-like schemas for rapidly changing data structures.', '{"pros": ["Schema flexibility for dynamic unstructured data", "Easily horizontal sharding"], "cons": ["Lacks multi-table ACID guarantees without careful setup"]}'),
(32, 'SQLite / Turso', 'database', 'Lightweight embedded or edge-replicated SQL database with zero configuration requirements.', '{"pros": ["Zero server setup cost or maintenance overhead", "Extremely fast local and edge read latency"], "cons": ["Not designed for heavy concurrent write operations"]}'),
(33, 'Redis (In-Memory Cache)', 'database', 'In-memory key-value data store used for high-speed caching, session management, and pub/sub broker queues.', '{"pros": ["Sub-millisecond read/write execution", "Built-in data structures (Lists, Sets, Hashes)"], "cons": ["Data size limited by RAM budget", "Requires persistence configuration for durable storage"]}'),
(34, 'MySQL / MariaDB', 'database', 'The most widely-deployed open-source relational database, especially common on traditional/shared hosting.', '{"pros": ["Enormous hosting availability and community familiarity", "Simpler operational model than Postgres for basic CRUD"], "cons": ["Fewer advanced data types and extensions than PostgreSQL"]}'),
(35, 'DynamoDB', 'database', 'Fully-managed, serverless key-value/wide-column NoSQL database built for AWS-scale, low-latency workloads.', '{"pros": ["Scales to essentially unlimited throughput with no server management", "Predictable low-latency at very large scale"], "cons": ["Query patterns must be designed upfront — awkward for ad-hoc queries"]}'),

(40, 'Vercel / Netlify', 'infrastructure', 'Serverless deployment platform built for instant global edge deployment and automated continuous integration.', '{"pros": ["Zero infrastructure management", "Automatic preview deployments per Git branch"], "cons": ["Higher bandwidth cost at massive scale"]}'),
(41, 'Docker + VPS (Hetzner / DigitalOcean)', 'infrastructure', 'Containerized hosting configuration offering cost control and infrastructure portability.', '{"pros": ["Predictable flat monthly compute cost", "Complete control over server environment"], "cons": ["Requires manual OS security patching and server maintenance"]}'),
(42, 'AWS (S3 / ECS / CloudFront)', 'infrastructure', 'Enterprise cloud infrastructure ecosystem capable of supporting arbitrary workload scale.', '{"pros": ["Unlimited horizontal scalability and compliance controls", "Industry standard for production environments"], "cons": ["High configuration complexity and unexpected bill spikes"]}'),
(43, 'Firebase Hosting / Supabase Cloud', 'infrastructure', 'Managed application cloud platform tailored for BaaS-backed mobile and web apps.', '{"pros": ["Tightly integrated with backend auth and database", "Seamless deployment pipeline"], "cons": ["Tied strictly to ecosystem platform services"]}'),
(44, 'Cloudflare (Workers / Pages / D1)', 'infrastructure', 'Edge-first hosting running code physically close to users worldwide, with a generous free tier.', '{"pros": ["Lowest latency via true edge execution", "Very generous free tier for small/medium projects"], "cons": ["Edge runtime has some Node.js API compatibility limits"]}'),
(45, 'Railway / Render / Fly.io', 'infrastructure', 'Simple all-in-one PaaS platforms that run traditional long-lived servers with minimal DevOps setup.', '{"pros": ["Much simpler setup than raw AWS/Docker for a full backend + DB", "Good middle ground between serverless and full VPS control"], "cons": ["Less mature and battle-tested than AWS at large enterprise scale"]}'),

(50, 'No frontend needed', 'frontend', 'This project has no user-facing interface — e.g. a backend API, CLI tool, or automated data pipeline.', '{"pros": ["Nothing to design, build, or maintain on this layer"], "cons": ["Revisit this if the project later grows an admin panel or client UI"]}'),
(51, 'No dedicated backend needed', 'backend', 'This project doesn''t need custom backend logic — e.g. a fully static site, or a frontend talking directly to a BaaS.', '{"pros": ["No server-side code to write, deploy, or maintain"], "cons": ["Revisit this if the project later needs custom business logic or private data access"]}'),
(52, 'No database needed', 'database', 'This project has no persistent data storage requirements.', '{"pros": ["No schema, migrations, or data layer to manage"], "cons": ["Revisit this if the project later needs to persist user or application data"]}');

-- ========================================================
-- QUESTIONS
-- ========================================================
-- Question 99 is a new, unscored gate asked before anything else: it never
-- feeds the weighted-scoring engine (no rows in `weights` reference its
-- options). It exists purely to let the app simplify the flow for total
-- beginners -- see AUTO_ANSWER_FOR_BEGINNERS in api/index.js -- so a brand
-- new coder isn't asked nuanced ops questions (setup complexity, budget
-- tiers) they have no context to answer confidently.
--
-- Questions 10-14 are new and were missing entirely from the original
-- questionnaire: none of the original 9 questions asked about
-- authentication needs, expected user scale, team size, or — critically for
-- someone who already knows exactly what they want — a direct frontend or
-- backend framework preference. All of these materially change the
-- recommended stack (see the questionnaire audit this schema accompanies).
INSERT INTO questions (id, prompt_text, is_first, is_multiselect) VALUES
(99, 'How would you describe your coding background?', TRUE, FALSE),
(1, 'What primary type of software are you building?', FALSE, FALSE),
(2, 'What platform will your users interact with most?', FALSE, TRUE),
(3, 'What specialized feature or workload does your system need?', FALSE, TRUE),
(4, 'What kind of data storage fits your project requirements?', FALSE, FALSE),
(5, 'What languages or frameworks are you most comfortable with?', FALSE, TRUE),
(6, 'What is your learning bandwidth or setup urgency?', FALSE, FALSE),
(7, 'Where do you plan to deploy and host the application?', FALSE, TRUE),
(8, 'What is your operational budget for infrastructure?', FALSE, FALSE),
(9, 'What is your project timeline and delivery target?', FALSE, FALSE),
(10, 'Does this project need user accounts or a login system?', FALSE, FALSE),
(11, 'Roughly how many users do you expect in the first 6-12 months?', FALSE, FALSE),
(12, 'Are you building this solo, or with a team?', FALSE, FALSE),
(13, 'Which frontend framework style appeals to you most?', FALSE, FALSE),
(14, 'Which backend framework style appeals to you most, if any?', FALSE, FALSE);

-- ========================================================
-- OPTIONS
-- ========================================================
-- In every question below, 'I don't know / Not sure yet' is placed as the
-- LAST option (highest id in that question's block) and flagged is_unsure =
-- TRUE. The app renders options in `ORDER BY id ASC` (see api/index.js), so
-- this ordering is what controls display order. is_unsure lets the client
-- enforce that "I don't know" can't be combined with a real answer on
-- multi-select questions (see QuestionCard.jsx).
INSERT INTO options (id, question_id, label, next_question_id, is_unsure) VALUES
(991, 99, 'Brand new — I have never built a project before', 1, FALSE),
(992, 99, 'Some experience — I have built small things and I am still learning', 1, FALSE),
(993, 99, 'Comfortable — I have built and shipped real projects before', 1, FALSE),
(994, 99, 'Experienced — I know what I am doing, give me full control', 1, FALSE),

(101, 1, 'Content Site / Blog / Portfolio (Fast static pages, low maintenance)', 2, FALSE),
(102, 1, 'Full-Stack Web Application (Dashboards, user accounts, interactive tools)', 2, FALSE),
(103, 1, 'Mobile Application (iOS & Android App)', 2, FALSE),
(104, 1, 'API / Microservice (Backend logic only, no user-facing UI)', 3, FALSE),
(105, 1, 'Data / AI / Machine Learning Pipeline (Data processing, ML models, scripts)', 3, FALSE),
(106, 1, 'I don''t know / Not sure yet (Use neutral web defaults)', 2, TRUE),

(201, 2, 'Modern Web Browsers (Desktop & Mobile Responsive)', 3, FALSE),
(202, 2, 'Cross-Platform Mobile Devices (iOS & Android App Stores)', 3, FALSE),
(203, 2, 'Static Web & Content Delivery Networks (CDN Edge)', 3, FALSE),
(204, 2, 'I don''t know / Not sure yet', 3, TRUE),

(301, 3, 'Standard CRUD forms, blogs, and marketing pages', 4, FALSE),
(302, 3, 'Real-time features (Live chat, instant notifications, WebSockets)', 4, FALSE),
(303, 3, 'Heavy background jobs, AI inference, or data processing', 4, FALSE),
(304, 3, 'High-concurrency API handling thousands of requests per second', 4, FALSE),
(305, 3, 'No backend logic needed (fully static or client-rendered only)', 4, FALSE),
(306, 3, 'I don''t know / Not sure yet', 4, TRUE),

(401, 4, 'Structured relational tables (Users, orders, relations)', 5, FALSE),
(406, 4, 'Structured relational tables, on a mainstream widely-hosted SQL database (MySQL-style)', 5, FALSE),
(402, 4, 'Flexible JSON documents / unstructured records', 5, FALSE),
(403, 4, 'Lightweight local database or file-based storage', 5, FALSE),
(404, 4, 'No database required (Pure static files or external API calls)', 5, FALSE),
(405, 4, 'I don''t know / Not sure yet', 5, TRUE),

(501, 5, 'JavaScript / TypeScript', 6, FALSE),
(502, 5, 'Python', 6, FALSE),
(503, 5, 'Go / Systems Programming', 6, FALSE),
(504, 5, 'Dart / Mobile Development', 6, FALSE),
(505, 5, 'Open to learning anything recommended', 6, FALSE),
(506, 5, 'Java / C#', 6, FALSE),
(508, 5, 'PHP', 6, FALSE),
(509, 5, 'Ruby', 6, FALSE),
(510, 5, 'Rust', 6, FALSE),
(507, 5, 'I don''t know / Not sure yet', 6, TRUE),

(601, 6, 'Need fastest possible setup (Minimal boilerplate & config)', 7, FALSE),
(602, 6, 'Willing to configure custom servers and tools for performance', 7, FALSE),
(603, 6, 'I don''t know / Not sure yet', 7, TRUE),

(701, 7, 'Serverless PaaS (Vercel, Netlify, Render)', 8, FALSE),
(702, 7, 'Containerized VPS (Docker, Hetzner, DigitalOcean)', 8, FALSE),
(703, 7, 'Managed BaaS / Cloud (Firebase, Supabase)', 8, FALSE),
(704, 7, 'Enterprise Cloud Infrastructure (AWS, GCP, Azure)', 8, FALSE),
(706, 7, 'Edge-first hosting (Cloudflare Workers, Pages, D1)', 8, FALSE),
(707, 7, 'Simple all-in-one PaaS (Railway, Render, Fly.io)', 8, FALSE),
(705, 7, 'I don''t know / Not sure yet', 8, TRUE),

(801, 8, 'Strictly free tier or open-source self-hosted', 9, FALSE),
(802, 8, 'Moderate monthly budget ($10 - $50/mo)', 9, FALSE),
(803, 8, 'Enterprise budget for production scale', 9, FALSE),
(804, 8, 'I don''t know / Not sure yet', 9, TRUE),

(901, 9, 'Quick hackathon / MVP prototype needed in days', 10, FALSE),
(902, 9, 'Production system built for long-term maintainability', 10, FALSE),
(903, 9, 'I don''t know / Not sure yet', 10, TRUE),

(1001, 10, 'Yes, users need to sign up / log in', 11, FALSE),
(1002, 10, 'No, no accounts or login needed', 11, FALSE),
(1003, 10, 'I don''t know / Not sure yet', 11, TRUE),

(1101, 11, 'Just me / a handful of testers (fewer than 100 users)', 12, FALSE),
(1102, 11, 'A small, growing audience (roughly 100 - 10,000 users)', 12, FALSE),
(1103, 11, 'Large scale (10,000+ users, or planning to grow fast)', 12, FALSE),
(1104, 11, 'I don''t know / Not sure yet', 12, TRUE),

(1201, 12, 'Solo developer', 13, FALSE),
(1202, 12, 'Small team (2-5 people)', 13, FALSE),
(1203, 12, 'Larger team, need shared conventions and structure', 13, FALSE),
(1204, 12, 'I don''t know / Not sure yet', 13, TRUE),

(1301, 13, 'Component-based with the biggest ecosystem (React-style)', 14, FALSE),
(1302, 13, 'Approachable, gentle learning curve (Vue-style)', 14, FALSE),
(1303, 13, 'Minimal runtime, compiles away boilerplate (Svelte-style)', 14, FALSE),
(1304, 13, 'Strict structure, built-in conventions (Angular-style)', 14, FALSE),
(1305, 13, 'No framework — plain HTML/CSS/JS is enough', 14, FALSE),
(1306, 13, 'No strong preference / not applicable', 14, TRUE),

(1401, 14, 'Convention-over-configuration, rapid CRUD (Rails-style)', NULL, FALSE),
(1402, 14, 'Strongly-typed, enterprise conventions (Spring Boot / ASP.NET-style)', NULL, FALSE),
(1403, 14, 'Batteries-included PHP framework (Laravel-style)', NULL, FALSE),
(1404, 14, 'Whatever fits the language I already picked', NULL, FALSE),
(1405, 14, 'I don''t know / Not sure yet', NULL, TRUE);

-- ========================================================
-- WEIGHTS
-- ========================================================
-- Weight values for questions 1-9 are unchanged from the original dataset.
-- New rows at the bottom cover the new questions (10-12). Question 99
-- (experience level) intentionally has no weight rows -- it is a UX gate,
-- not a scoring input (see schema comment above and api/index.js).
--
-- A separate fix -- boosting the weight of whichever question is the single
-- most *direct* question for a category (Q5 for language, Q4 for database,
-- Q7 for infrastructure) -- is applied at query time in api/index.js rather
-- than by inflating these raw numbers, so this table stays an honest record
-- of each answer's face-value relevance. See PRIMARY_QUESTION_BY_CATEGORY.
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
(305, 51, 20),
(401, 30, 12),
(406, 34, 12),
(402, 31, 12),
(403, 32, 12),
(404, 52, 20),
(501, 1, 10), (501, 10, 8), (501, 20, 8),
(502, 2, 10), (502, 21, 10),
(503, 3, 10), (503, 22, 10),
(504, 4, 10), (504, 13, 10),
(506, 5, 12), (506, 42, 8),
(508, 6, 10), (508, 26, 10),
(509, 7, 10), (509, 24, 10),
(510, 8, 10),
(601, 10, 6), (601, 12, 8), (601, 23, 10), (601, 40, 10),
(602, 22, 8), (602, 41, 10), (602, 42, 8),
(701, 40, 12),
(702, 41, 12),
(703, 23, 10), (703, 43, 12),
(704, 42, 12), (704, 5, 6),
(706, 44, 12),
(707, 45, 12),
(801, 32, 8), (801, 40, 8), (801, 41, 8),
(802, 30, 8), (802, 41, 8),
(803, 42, 12), (803, 5, 10),
(901, 12, 8), (901, 23, 10), (901, 40, 10),
(902, 30, 8), (902, 41, 8), (902, 42, 8), (902, 5, 6),

-- Q10: authentication needs -- "yes" points toward BaaS (auth is Supabase/
-- Firebase's headline feature) and its matching hosting; "no" gives a small
-- nudge toward "no dedicated backend needed" without single-handedly
-- deciding it (kept low on purpose, see CONFIDENCE_MARGIN_THRESHOLD).
(1001, 23, 12), (1001, 43, 8), (1001, 20, 6),
(1002, 51, 6),

-- Q11: expected scale -- database and infra should reflect *load*, not
-- just budget. A tiny personal project and a free-tier app anticipating
-- real growth were previously indistinguishable to the engine.
(1101, 32, 10), (1101, 40, 6),
(1102, 30, 10), (1102, 40, 6), (1102, 41, 4),
(1103, 42, 14), (1103, 30, 8), (1103, 33, 8),

-- Q12: team size -- opinionated, convention-heavy frameworks pay off more
-- for teams; lightweight/flexible setups suit a solo builder.
(1201, 11, 8), (1201, 32, 4),
(1202, 10, 8), (1202, 20, 6),
(1203, 5, 10), (1203, 42, 8),

-- Q13: frontend framework style -- lets someone who already knows exactly
-- what they want (e.g. "I want Vue") state that directly, instead of it
-- only ever being inferable indirectly from project-type/workload answers.
(1301, 10, 8), (1301, 11, 6),
(1302, 15, 14),
(1303, 16, 14),
(1304, 17, 14),
(1305, 18, 14),

-- Q14: backend framework style -- same idea, for Rails/Spring/Laravel,
-- which otherwise had no direct question pointing at them at all.
(1401, 24, 14),
(1402, 25, 14),
(1403, 26, 14);

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('tech_items_id_seq', (SELECT MAX(id) FROM tech_items));
