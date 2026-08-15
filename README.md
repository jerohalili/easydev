# EasyDev | Tech Stack Identifier

## Short Introduction

EasyDev is a full-stack web app that answers one specific question junior developers and recent grads get stuck on: *what should I actually build this with?*

Instead of another "best practices" article or a generic framework comparison, EasyDev asks a short, branching questionnaire about the actual project — what it is, how many users it expects, what the team already knows, what the budget looks like — and returns a scored, explained recommendation across five categories: **Language, Frontend Framework, Backend Framework, Database, and Infrastructure**. Every recommendation comes with a plain-language reason and a pros/cons trade-off summary, not just a name.

**Core Philosophy:** *A decision engine, not a lookup table.*

The project also exists as a way to practice building a real weighted-scoring system and a data model (questions, branching logic, weighted options, tech items) that stays maintainable as more questions and technologies get added — rather than a hardcoded if/else chain.

---

## Live Website

**Website:** [https://easydev-mu.vercel.app/](https://easydev-mu.vercel.app/)

---

## Technologies Used

### Frontend
- React 19
- Vite
- Plain CSS with a custom variable-based theming system (dark/light mode, no framework)

---

### Backend
- Node.js
- Express 5
- node-postgres (`pg`)

---

### Database
- PostgreSQL
- Schema-driven, hand-seeded question tree, weight matrix, and tech-item catalog (no ORM — raw SQL by design, for full control over the scoring queries)

---

### Dev Tools
- Nodemon (backend hot-reload)
- Docker Compose (local Postgres)
- ESLint

---

## Features

### Branching, Multi-Select Questionnaire
The questionnaire isn't a flat list — later questions depend on earlier answers. Choosing "API / Microservice" as the project type skips the frontend-platform question entirely, since it doesn't apply. Several questions also support selecting more than one answer where that's realistic (e.g. a project can need both real-time features *and* heavy background processing).

This reduces:
- Irrelevant questions for the user's specific project type
- Forced single-choice answers where multiple things are genuinely true

---

### Weighted-Scoring Recommendation Engine
Every answer option carries hand-assigned weight values toward specific technologies. When the questionnaire completes, the engine sums weights per technology across every answer given, and returns the highest scorer in each of the five categories — with a `reasoning_text` string generated from which of the user's actual answers contributed most to that pick.

This improves:
- Recommendation accuracy tied directly to stated constraints, not generic advice
- Transparency — the user sees *why*, not just *what*

---

### Trade-Off Comparison Panel
Each recommended technology carries a stored pros/cons summary, surfaced alongside the reasoning text and in the comparison view below.

---

### Project Dashboard & History
Every completed questionnaire is saved as a project. Projects can be revisited from a dashboard, and every re-score is preserved as history rather than overwritten — so a project's recommendation timeline stays intact even after answers are edited.

---

### Side-by-Side Stack Comparison
Beyond the system's recommendation, users can build their own stack manually — picking one technology per category from the same list the engine knows about — and see it rendered next to the recommended pick with a match/override indicator per category.

This improves:
- Confidence for users who already have a preference and want to sanity-check it
- Visibility into where a manual choice diverges from the data-driven pick

---

### Dark / Light Theme
A full CSS-variable theming system with a manual toggle, applied consistently across every screen.

---

## Development Process (How It Was Built and Why)

### Why I Built It

Most "pick your tech stack" content online is either a static opinion piece or assumes the reader already knows enough to weigh the trade-offs themselves. Neither actually helps someone standing at the very start of a project with a blank terminal and no clear next step.

I wanted to build something that treats the decision the way it actually works in practice: as a set of constraints (team size, scale, timeline, budget, existing skills) that get weighed against each other, not a single "best" answer that ignores context.

### Build Order

The project was built schema-first, deliberately, because the riskiest unknowns — branching logic and a weighted scoring model — live in the data model, not the UI:

1. **Data model first.** Questions, options, branching (`next_question_id`), tech items, and a weight matrix were designed and seeded before any interface existed, validated end-to-end with a hardcoded scoring stub.
2. **Real scoring engine.** The stub was replaced with an actual weighted-sum query, grouped by category, with dynamically generated reasoning text pulled from whichever answer contributed the most weight to each winning technology.
3. **Dashboard and persistence.** Projects became revisitable, with results stored as history rather than overwritten on re-score.
4. **Comparison view.** A second, user-built stack could be assembled and rendered against the recommendation.
5. **Iterative debugging.** Several real data-integrity bugs surfaced along the way and were fixed deliberately rather than patched over — an unreachable "Java / C#" recommendation with zero weight coverage, a scoring endpoint that was silently deleting result history instead of preserving it, and a progress bar that assumed every path through the questionnaire was the same length when the branching logic meant it wasn't.

### What's Still Open

- A client-side entry point for editing a completed project's answers (the backend already supports it cleanly)
- A full responsive pass and consistent design-system application across every screen
- Deployment

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker, via the included `docker-compose.yml`)

### 1. Clone the repo
```bash
git clone https://github.com/jerohalili/easydev.git
cd easydev
```

### 2. Start Postgres
```bash
docker compose up -d
```

### 3. Set up the server
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/easydev
PORT=5000
```

Load the schema and seed data:
```bash
psql "$DATABASE_URL" -f schema.sql
```

Start the server:
```bash
npm run dev
```

### 4. Set up the client
```bash
cd ../client
npm install
npm run dev
```

The app will be running with the client on Vite's default port and the API on `http://localhost:5000`.

---

## License

See [LICENSE](./LICENSE) for details.
