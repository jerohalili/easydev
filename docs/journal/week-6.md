# EasyDev - Week 6

## Week of: September 20-26, 2026

## My goal this week

Finalize the docs, stop losing questionnaire progress, and ship EasyDev as a portfolio case study — not just a repo + live URL.

## What I did

- I finalized documentation (`dcbd027`, `9d034be`): `AI-USAGE.md`, `SECURITY-CHECKLIST.md`, README §§1–7, plus 3 live screenshots in `docs/screenshots/`.
- I made quiz saves non-blocking (`094fb62`, `App.jsx` +260/-80): per-answer saves + next-question fetches run in the background (`pendingSavesRef`, `questionCacheRef` prefetch); `loading` is now only for start, review build, and scoring.
- I added Continue/Resume (`e055eb5`, `api/index.js` +141): new `GET /api/projects/:id/resume` rebuilds the answered path in first-answered order with the authoritative next question (branching + brand-new auto-skip); `GET /api/projects` now returns `answer_count`, `last_answered_at`, and branching-aware `total_questions` so history shows real progress. Client `resumeProposal()` hydrates the path so Back/edit works right after resume.
- I launched the portfolio page (`jerohalili.github.io a93dacd`, Sep 25): `easydev-tech-stack-advisor.md` case study + cover image + carousel/routing rework, plus carousel/scroll fixes (`b30a046`, `43ebb66`). Portfolio: https://jerohalili.github.io/projects/easydev-tech-stack-advisor

## What blocked me

- Computing resume progress (`answered + remaining`) needs a branching-aware walk per incomplete project, and one slow project could break the whole history response — so I wrapped it per-row with fallback to `answer_count`.
- Background saves must flush before review/scoring or answers go missing; I track them in `pendingSavesRef`, but the prod smoke (answer → reload → Continue → review → score) is still open.
- `1aa9877` says "remove prev security implementation" but is a 1-line README caption fix — I am noting it here so the log stays honest.

## What I learned

- Resume has to mirror `POST answers` logic exactly (branching + auto-skip), or the resumed path disagrees with a fresh run. The server is the authority; the client just hydrates.
- Portfolio writing exposed every README gap: if a stranger can't run it from §§2–3 alone, the case study falls apart too. Docs + portfolio are the same work.
