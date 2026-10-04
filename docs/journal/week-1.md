# EasyDev - Week 1

## Week of: August 15-22, 2026

## My goal this week

Get a working MVP live: a questionnaire that branches, scores answers into a tech stack, and deploys on Vercel with a real database.

## What I did

- I built the React + Vite + Express + Postgres skeleton (`0c363bb`, renamed to easydev in `c924004`).
- I made the questionnaire screens with branching via `next_question_id`, back-navigation cache, and a review screen (`7179681`, across `App.jsx`, `QuestionCard.jsx`, `ProgressBar.jsx`, `ResultsView.jsx`, `server/index.js`, `server/schema.sql`).
- I wrote the scoring engine as a weighted sum per category (language, frontend, backend, database, infrastructure) with reasoning text (`e23f4da`, `4b7c37a`, `server/seed.sql`).
- I added the comparison view (`40adfb1`), multi-select (`879d9a1`), history plus light mode (`b0c7c10`), and questionnaire bug fixes (`474fe67`, `19f8f38`).
- I ran the smarter-system pass on Aug 17-18 (`8c01a57`, `66cf868`, `fdbe74f`, `a2b24b8`, `a0d5f20`).
- I shipped it: `179971e` for Vercel support (`vercel.json`), `bda277d` readme, live link in `511f75d`, then hardened Vercel + Neon (`1294024`, `bdfc7da`, `cdfae30`, `a8b35af`, `bebb7cd`, `98e259f` which removed local-only paths).
- I set the styling baseline with Tailwind, crimson style, icons, and responsiveness (`856e6e6`, `273dcc5`, `9bb496e`, `e5b6c39`, `dc5e4dc`, `9415ced`).

## What blocked me

- My standalone Express shape did not map to a serverless function, so I broke prod about 5 times in one day with repeated `fix: vercel server` commits. Local-only code kept breaking prod until I committed to Vercel + Neon and deleted the local-only paths.
- My scoring mis-ranked: incidental answer points outranked explicit picks. I noted it this week and fixed it later with `PRIMARY_BOOST_MULTIPLIER = 5`.
- My styling drifted per component because Tailwind v4 layered over my custom CSS-variable theming (`--bg-main`, `data-theme`). That caused the repeated broken-style fixes.

## What I learned

- Schema first pays off: questions, options, branching, and the weight matrix before polish gave me a decision engine instead of a hardcoded if/else chain.
- One Vercel unit (client + `/api` serverless fn) plus Neon kills CORS and server management, but I have to write server code in serverless shape from the start.
- I should have tested ranking edge cases (all "I don't know", tiny margins) before calling the MVP done.
