# EasyDev | Tech Stack Identifier

## Short Introduction

EasyDev is a full-stack web app that answers one specific question junior developers and recent grads get stuck on: *what should I actually build this with?*

Instead of another "best practices" article or a generic framework comparison, EasyDev asks a short, branching questionnaire about the actual project — what it is, how many users it expects, what the team already knows, what the budget looks like — and returns a scored, explained recommendation across five categories: **Language, Frontend Framework, Backend Framework, Database, and Infrastructure**. Every recommendation comes with a plain-language reason and a pros/cons trade-off summary, not just a name.

**Core Philosophy:** *A decision engine, not a lookup table.*

The project also exists as a way to practice building a real weighted-scoring system and a data model (questions, branching logic, weighted options, tech items) that stays maintainable as more questions and technologies get added — rather than a hardcoded if/else chain.

---

## Live Website

**Website:** <https://easydev-nine.vercel.app/>

---

## Technologies Used

### Frontend

- React 19
- Vite
- Tailwind CSS v4, layered on top of a custom CSS-variable theming system (`--bg-main`, `--text-primary`, `--primary-accent`, etc.) that drives dark/light mode via a `data-theme` attribute on `<html>` — Tailwind handles layout and utility styling, the CSS variables handle theme-aware colors
- [@phosphor-icons/react](https://phosphoricons.com/) for icons

### Backend

- Node.js
- Express 5 — not a standalone server; the entire API is one Express app (`api/index.js`) exported as a handler and run as a single Vercel serverless function. `vercel.json` rewrites all `/api/*` requests to that function and everything else to `index.html`, so the client and API deploy and scale together as one unit.
- node-postgres (`pg`)

### Database

- PostgreSQL (hosted on [Neon](https://neon.tech))
- Schema-driven, hand-seeded question tree, weight matrix, and tech-item catalog — no ORM, raw SQL by design, for full control over the scoring queries
- Core tables: `projects`, `questions`, `options`, `tech_items`, `weights`, `answers`, `results`, `user_stacks`

### Dev Tools

- Vercel CLI (`vercel dev` runs the client and the `/api` serverless function together locally, matching production)
- ESLint

---

## Features

### Branching, Multi-Select Questionnaire

The questionnaire isn't a flat list — later questions depend on earlier answers via each option's `next_question_id`. Choosing "API / Microservice" as the project type skips the frontend-platform question entirely, since it doesn't apply. Several questions also support selecting more than one answer where that's realistic (e.g. a project can need both real-time features *and* heavy background processing).

This reduces:
- Irrelevant questions for the user's specific project type
- Forced single-choice answers where multiple things are genuinely true

### Weighted-Scoring Recommendation Engine

Every answer option carries hand-assigned weight values toward specific technologies (`weights` table). When the questionnaire completes, the engine sums weights per technology across every answer given, grouped by category, and returns the highest scorer in each of the five categories — with a `reasoning_text` string generated from which of the user's actual answers contributed most to that pick.

This improves:
- Recommendation accuracy tied directly to stated constraints, not generic advice
- Transparency — the user sees *why*, not just *what*

### Trade-Off Comparison Panel

Each recommended technology carries a stored pros/cons summary (`trade_offs`), surfaced alongside the reasoning text and in the comparison view below.

### Project Dashboard & History

Every completed questionnaire is saved as a project. Projects can be revisited from a dashboard (`HistoryView`), and every re-score is preserved as history rather than overwritten — so a project's recommendation timeline stays intact even after answers are edited.

### Side-by-Side Stack Comparison

Beyond the system's recommendation, users can build their own stack manually — picking one technology per category from the same list the engine knows about (`ComparisonView`) — and see it rendered next to the recommended pick with a match/override indicator per category.

This improves:
- Confidence for users who already have a preference and want to sanity-check it
- Visibility into where a manual choice diverges from the data-driven pick

### Dark / Light Theme

A CSS-variable theming system with a manual toggle (`ThemeToggle`), persisted to `localStorage` and applied consistently across every screen via a `data-theme` attribute.

### Resilient API Handling

`client/src/config.js` wraps every request in a fetch helper that checks `res.ok` before parsing JSON, surfaces the server's actual error message when available, and falls back to a clear message on network failure — instead of silently treating an error response as a success payload.

---

## Development Process (How It Was Built and Why)

### Why I Built It

Most "pick your tech stack" content online is either a static opinion piece or assumes the reader already knows enough to weigh the trade-offs themselves. Neither actually helps someone standing at the very start of a project with a blank terminal and no clear next step.

I wanted to build something that treats the decision the way it actually works in practice: as a set of constraints (team size, scale, timeline, budget, existing skills) that get weighed against each other, not a single "best" answer that ignores context.

### Build Order

The project was built schema-first, deliberately, because the riskiest unknowns — branching logic and a weighted scoring model — live in the data model, not the UI:

1. **Data model first.** Questions, options, branching (`next_question_id`), tech items, and a weight matrix were designed and seeded before any interface existed, validated end-to-end with a hardcoded scoring stub.
2. **Real scoring engine.** The stub was replaced with an actual weighted-sum SQL query, grouped by category, with dynamically generated reasoning text pulled from whichever answer contributed the most weight to each winning technology.
3. **Dashboard and persistence.** Projects became revisitable, with results stored as history rather than overwritten on re-score.
4. **Comparison view.** A second, user-built stack could be assembled and rendered against the recommendation.
5. **Iterative debugging.** Several real data-integrity bugs surfaced along the way and were fixed deliberately rather than patched over — an unreachable "Java / C#" recommendation with zero weight coverage, a scoring endpoint that was silently deleting result history instead of preserving it, and a progress bar that assumed every path through the questionnaire was the same length when the branching logic meant it wasn't.
6. **Backend migration.** The API was converted from a standalone Express server to a single Express app running as a Vercel serverless function, with the client's API references consolidated to one relative `/api` constant so client and server deploy as one unit with no CORS or environment-specific base URLs to manage.
7. **Resilience and polish pass.** `res.ok` checks and user-facing error states were added across the client (`HistoryView`, `ComparisonView`), an empty-state message was added to `ResultsView`, and a full responsive/design-system consistency pass was applied across every screen.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- A [Neon](https://neon.tech) Postgres database (or any Postgres instance — just point `DATABASE_URL` at it)

### 1. Clone the repo

```
git clone https://github.com/jerohalili/easydev.git
cd easydev
```

### 2. Install dependencies

```
npm install
cd client && npm install && cd ..
```

### 3. Configure environment

```
cp .env.example .env
```

Fill in `DATABASE_URL` with your Neon pooled connection string (it must include `sslmode=require`, which `db/db.js` checks for to enable SSL) — or run `vercel env pull .env` if the project is already linked to Vercel.

### 4. Load the schema and seed data

```
psql "$DATABASE_URL" -f db/schema.sql
```

### 5. Run it

```
vercel dev
```

This serves the client and the `/api` serverless function together on one local port — the same setup as production.

---

## License

See [LICENSE](https://github.com/jerohalili/easydev/blob/main/LICENSE) (MIT) for details.
