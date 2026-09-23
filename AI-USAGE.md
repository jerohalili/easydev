# AI-USAGE — EasyDev

Started week 1, kept alongside work. Full 6 + 3 + who-wrote-what for finals badge; this is the current log.

## 1. How I used AI

- 2026-08-17, Claude — scoring stub → weighted-sum SQL. Kept the grouping idea, rewrote ranking with `PRIMARY_BOOST x5` after mis-rank. Commit `e23f4da` / `4b7c37a`.
- 2026-08-18, Copilot — comparison view scaffold (`ComparisonView.jsx`). Kept layout, changed data source to `GET /tech-items` + `user-stack` upsert. Commit `40adfb1`.
- 2026-09-13, Claude — Vercel migration (standalone Express → single serverless fn). Kept rewrite rules, deleted local-only paths. Commit `98e259f` / `8ac6034`.
- 2026-09-14, Copilot — `client/src/config.js` `res.ok` guard + server-message surfacing. Kept as-is after 500-rendered-as-picks bug. Commit `6017d02`.
- 2026-09-15, Claude — `local-server.js` + Vite proxy + `concurrently` scripts for `npm run dev`. Kept, fixed SSL gating (`sslmode=require`). Commit `a5d17be`.
- 2026-09-19, Claude — README restructure to §§1–7 + SECURITY-CHECKLIST evidence wording. Kept structure, rewrote evidence in own words. Commit (this change).

## 2. Where the AI got it wrong

- Forced SSL everywhere broke local Postgres (no `sslmode=require` locally). Fixed with conditional SSL in `db/db.js:6`. Commit `a5d17be`.
- Suggested fixed progress length 9; branching skips broke it. Fixed with server `remaining_steps`. Commit Week-5 polish.
- First Vercel shape kept standalone `app.listen` in the fn, breaking prod 5×. Fixed by exporting the app and deleting local-only code. Commit `98e259f`.

## 3. Who wrote what

- I wrote: weighted-scoring query + `SAFE_DEFAULTS`/`CONFIDENCE_MARGIN`/`CONTRADICTION_RULES` in `api/index.js` (commits `e23f4da`, Week-5 finalize) — sums weights per category, boosts explicit picks, flags thin wins. SSL-conditional pool in `db/db.js`. Branch-aware back-navigation in `QuestionCard.jsx`/`App.jsx`.
- Best-understood AI piece: `client/src/config.js` fetch helper — checks `res.ok`, parses server `error`, throws human message; I kept it because `fetch` only throws on network failure and we rendered 500s as picks before.
