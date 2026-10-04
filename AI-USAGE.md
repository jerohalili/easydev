# AI-USAGE — EasyDev

Started week 1, kept alongside work. Full 6 + 3 + who-wrote-what for finals badge; this is the current log.

## 1. How I used AI

- 2026-08-17, Claude — scoring stub → weighted-sum SQL. Kept the grouping idea, rewrote ranking with `PRIMARY_BOOST x5` after mis-rank. Commits [`e23f4da`](https://github.com/jerohalili/easydev/commit/e23f4daf01a0e3378c4b16404443e29b07e2ed72) / [`4b7c37a`](https://github.com/jerohalili/easydev/commit/4b7c37aea44a7f757e5ad24b516081bc5b9223ed).
- 2026-08-18, Copilot — comparison view scaffold (`ComparisonView.jsx`). Kept layout, changed data source to `GET /tech-items` + `user-stack` upsert. Commit [`40adfb1`](https://github.com/jerohalili/easydev/commit/40adfb176db148fd85aa4ac6ec9ba3f91bf94f6e).
- 2026-09-13, Claude — Vercel migration (standalone Express → single serverless fn). Kept rewrite rules, deleted local-only paths. Commits [`98e259f`](https://github.com/jerohalili/easydev/commit/98e259f6ad6ef4b94faffc417b0f372c7eaa1bd8) / [`8ac6034`](https://github.com/jerohalili/easydev/commit/8ac6034e39f230c569e2db1598379d7c65a2ea95).
- 2026-09-14, Copilot — `client/src/config.js` `res.ok` guard + server-message surfacing. Kept as-is after 500-rendered-as-picks bug. Commit [`6017d02`](https://github.com/jerohalili/easydev/commit/6017d02cb4e7b70f9d6dd69d883f98e76955a1f3).
- 2026-09-15, Claude — `local-server.js` + Vite proxy + `concurrently` scripts for `npm run dev`. Kept, fixed SSL gating (`sslmode=require`). Commit [`a5d17be`](https://github.com/jerohalili/easydev/commit/a5d17be43f8f9d25c54bb83d87bf7e3f604321bc).
- 2026-09-19, Claude — README restructure to §§1–7 + SECURITY-CHECKLIST evidence wording. Kept structure, rewrote evidence in own words. Commit [`dcbd027`](https://github.com/jerohalili/easydev/commit/dcbd027b4bd0e5c3dca28b8513787913e9561383).
- 2026-09-20–26 (Week 6) — no new AI prompts logged. Continue/Resume (`GET /:id/resume`, `resumeProposal()`), background saves + prefetch cache, and portfolio case-study assembly were written by hand; docs §4–§5 updated to match.

## 2. Where the AI got it wrong

- Forced SSL everywhere broke local Postgres (no `sslmode=require` locally). Fixed with conditional SSL in `db/db.js:6`. Commit [`a5d17be`](https://github.com/jerohalili/easydev/commit/a5d17be43f8f9d25c54bb83d87bf7e3f604321bc).
- Suggested fixed progress length 9; branching skips broke it. Fixed with server `remaining_steps`. Commit [`6017d02`](https://github.com/jerohalili/easydev/commit/6017d02cb4e7b70f9d6dd69d883f98e76955a1f3) (Week-5 polish).
- First Vercel shape kept standalone `app.listen` in the fn, breaking prod 5×. Fixed by exporting the app and deleting local-only code. Commit [`98e259f`](https://github.com/jerohalili/easydev/commit/98e259f6ad6ef4b94faffc417b0f372c7eaa1bd8).

## 3. Who wrote what

- I wrote: weighted-scoring query + `SAFE_DEFAULTS`/`CONFIDENCE_MARGIN`/`CONTRADICTION_RULES` in `api/index.js` (commits [`e23f4da`](https://github.com/jerohalili/easydev/commit/e23f4daf01a0e3378c4b16404443e29b07e2ed72), [`8ac6034`](https://github.com/jerohalili/easydev/commit/8ac6034e39f230c569e2db1598379d7c65a2ea95) Week-5 finalize) — sums weights per category, boosts explicit picks, flags thin wins. SSL-conditional pool in `db/db.js`. Branch-aware back-navigation in `QuestionCard.jsx`/`App.jsx`.
- Best-understood AI piece: `client/src/config.js` fetch helper — checks `res.ok`, parses server `error`, throws human message; I kept it because `fetch` only throws on network failure and we rendered 500s as picks before.
