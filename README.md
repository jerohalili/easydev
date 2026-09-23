# EasyDev | Tech Stack Identifier

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

> Built with AI assistance (Claude + Copilot) across scaffolding, debugging, and copy polish; see [AI-USAGE.md](AI-USAGE.md) for the full log.

**Repo:** https://github.com/jerohalili/easydev
**Live:** https://easydev-nine.vercel.app/

---

## 1. Overview

EasyDev is a full-stack web app that tells junior developers and recent grads what to build their project with. You answer a short branching questionnaire about your project, team, scale, and constraints, and it returns a scored recommendation across five categories — Language, Frontend, Backend, Database, Infrastructure — each with plain-language reasoning and pros/cons.

**Core philosophy:** *A decision engine, not a lookup table.* Weighted scoring + branching data model instead of hardcoded if/else.

Technologies: React 19 + Vite + Tailwind v4 (client), Express 5 as a single Vercel serverless function (`api/index.js`), PostgreSQL on Neon via `pg` (no ORM), Vercel CLI for prod-parity local dev.

---

## 2. Setup and installation

### Prerequisites

- Node.js 18+
- Vercel CLI: `npm i -g vercel`
- A Postgres database (Neon recommended — any Postgres works)

### 2.1 Get the code

```bash
git clone https://github.com/jerohalili/easydev.git
cd easydev
```

### 2.2 Install dependencies

```bash
npm install
cd client && npm install && cd ..
# or: npm run install:all
```

### 2.3 Environment and configuration

```bash
cp .env.example .env
```

| Variable | Required | Example value | Notes |
|----------|----------|---------------|-------|
| `DATABASE_URL` | Yes | `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require` | Neon pooled connection string. Must include `sslmode=require` — `db/db.js` enables SSL only when present. Never commit the real value. Alternative: `vercel env pull .env` if linked to Vercel. |

No other env vars. Client uses relative `API_BASE = '/api'` (`client/src/config.js`), so no frontend env needed.

### 2.4 Set up and seed the database

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Creates 8 tables (`projects, questions, options, tech_items, weights, answers, results, user_stacks`) and seeds the question tree (Q99–Q14), ~60 options, weight matrix, and ~30 tech items.

---

## 3. How to run it

Primary (prod parity — client + `/api` on one port, same as production):

```bash
vercel dev
```

Alternative (split local dev, no Vercel account needed):

```bash
npm run dev
# runs: node local-server.js (API on http://localhost:3001)
#   +   Vite dev server (client on http://localhost:5173, /api proxied to :3001)
```

Health check: `GET /api/health` should return 200 with `SELECT NOW()`.

What you should see: the questionnaire start screen (“New” tab) where you create a project with title/description, then the first question. The “History” tab lists past projects. Live reference: https://easydev-nine.vercel.app/

Deploy: push to Vercel; `vercel.json` builds `client/dist` and rewrites `/api/*` to the serverless function, everything else to `index.html`. Set `DATABASE_URL` in Vercel Project Settings → Environment Variables.

---

## 4. Features and usage

Primary flow: **Start → Quiz → Review → Results → Compare → History**

1. **Start:** create a project (`POST /projects`) → first question loads.
2. **Quiz:** branching questions via `next_question_id` (e.g. “API / Microservice” skips frontend-platform). Multi-select where realistic. `ProgressBar` uses server `remaining_steps`. Contradiction warnings shown inline (e.g. realtime + no-backend-logic).
3. **Review:** grouped answer summary, click any row to jump back and edit (forward branch is discarded and rebuilt).
4. **Results:** weighted-sum scoring per category with `PRIMARY_BOOST x5`, `SAFE_DEFAULTS` on all-zero layers, `needs_confirmation` on thin margins. Each pick shows reasoning text + trade-offs.
5. **Compare:** build your own stack manually from the same catalog and see match/override per category.
6. **History:** every project + every re-score preserved (append, not overwrite). Reopen, delete, restart.

Other features: dark/light theme (`data-theme` + `localStorage`), responsive layout, resilient fetch helper (`res.ok` check + server message surfacing in `client/src/config.js`).

### Main API endpoints (`api/index.js`, single Express app)

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/health` | DB healthcheck (`SELECT NOW()`) |
| GET | `/api/projects` | List projects with latest recommendations |
| POST | `/api/projects` | Create `{title, description}` → returns `first_question_id` |
| GET | `/api/projects/:id` | Single project + results + answers |
| DELETE | `/api/projects/:id` | Delete project (cascades) |
| GET | `/api/questions/:id` | Quiz step: question + options + `remaining_steps` |
| GET | `/api/projects/:id/summary` | Review-screen grouped answers |
| POST | `/api/projects/:id/answers` | Save answers (single `option_id` or `option_ids[]`), returns `{next_question_id, warnings}` |
| POST | `/api/projects/:id/score` | Run weighted scoring, append result row |
| GET | `/api/tech-items` | Full tech catalog for comparison view |
| GET | `/api/projects/:id/user-stack` | Manual picks |
| POST | `/api/projects/:id/user-stack` | Upsert manual pick `{category, tech_item_id, notes}` |

---

## 5. Project structure

```
easydev/
  api/index.js        # entire API: single Express app → Vercel serverless fn
  client/src/
    App.jsx           # tab + screen state machine (new/history, start/quiz/review/results)
    config.js         # API_BASE='/api' + apiFetch with res.ok guard
    categoryStyles.js # shared badge map
    components/       # QuestionCard, ProgressBar, ResultsView, HistoryView, ComparisonView, ThemeToggle
    main.jsx, index.css
  client/vite.config.js # :5173 + /api → localhost:3001 proxy
  db/db.js            # pg.Pool, SSL only when sslmode=require
  db/schema.sql       # 8 tables + seed (questions, options, weights, tech_items)
  local-server.js     # local dev: require api/index.js, listen :3001
  vercel.json         # build client/dist, rewrite /api/* → fn, rest → index.html
  package.json        # concurrently scripts: dev, dev:api, dev:client, dev:vercel
  DESIGN-SYSTEM.html  # token/component spec
```

---

## 6. Screenshots

> Captured from the live site (`easydev-nine.vercel.app`) by the author on Sep 23, 2026.

![Start screen](docs/screenshots/proposal-start.jpeg)
*Start screen — create a project proposal to begin the questionnaire.*

![Proposal history](docs/screenshots/proposal-history.jpeg)
*Proposal history — past assessments with their recommended stack badges.*

![Results](docs/screenshots/results-tradeoff.jpeg)
*Scored picks per category with reasoning, plus the architectural trade-off analysis.*

---

## 7. Known issues and next steps

- Open demo by design: no login; anyone with a project UUID can read/mutate it (no `userId` scoping). Fine for a class demo, would need auth + ownership before real users.
- `cors()` is unrestricted (`api/index.js:8`). Would restrict to the Vercel origin in production.
- Server validation is thin (`answers` checks non-empty only; `score`/`user-stack` rely on DB constraints). Would add type/FK/whitelist checks.
- Post-migration prod verification at `easydev-nine.vercel.app` + final responsive pass still to confirm.
- Next: auth + per-user history, stricter validation, restricted CORS, pagination on history.

---

## License

See [LICENSE](https://github.com/jerohalili/easydev/blob/main/LICENSE) (MIT).
