# EasyDev - Week 5

## Week of: September 13-19, 2026

## My goal this week

Finalize the Vercel migration, clean up leftovers, clarify user-facing errors, and get local dev back to prod parity.

## What I did

- I trimmed the design system (`086dd75`): removed Page Structure / Focus Ring / Component Locations sections and condensed Animation to one block.
- I finalized the migration (`8ac6034`, 37+/225- across 9 files): deleted standalone-Express leftovers from `api/index.js`, trimmed `App.jsx`, `ComparisonView.jsx`, `HistoryView.jsx`, `QuestionCard.jsx`, `ResultsView.jsx`, `config.js`, and condensed `db/schema.sql` comments to one-liners.
- I reworked popups and renamed for clarity (`6017d02`, 326+/281- across 11 files): `history` to `proposalPath`, `results` to `stackPicks`, `warnings` to `proposalFlags`, handlers `startProposal`, `fetchQuestionnaireStep`, `submitProposalAnswer`. I rewrote error copy (`Couldn't open "<title>" proposal...`, `Couldn't save that questionnaire answer...`) and added the `res.ok` guard with server-message surfacing in `client/src/config.js:9-28`.
- I brought back better local dev (`a5d17be`, 354+/7- across 6 files): new `local-server.js` (requires `api/index.js`, listens on 3001), `client/vite.config.js:7-12` proxy for `/api` to `localhost:3001`, `concurrently` scripts (`dev`, `dev:api`, `dev:client`, `dev:vercel`), and SSL only when `sslmode=require` in `db/db.js:6` with `dotenv quiet:true`.

## What blocked me

- Forcing SSL everywhere broke local connect because my local Postgres URL has no `sslmode=require` (`db/db.js:4-6`). I fixed it by enabling SSL only when that flag is set.
- My first progress bar hardcoded length 9, so it jumped backwards on branching skip paths. I fixed it by using `remaining_steps` from the database.
- I silently rendered 500 payloads as recommendations because `fetch` only throws on network failure. I fixed it with the `res.ok` guard.
- Going Back blanked answers (`QuestionCard.jsx:9`), and editing an early answer left a stale forward branch, so I discard forward history and rebuild it.

## What I learned

- I keep client + API as one Vercel unit (`vercel.json` rewrites `/api/*` to the function, rest to `index.html`) with `API_BASE = '/api'` so there are no CORS or env-specific base URLs.
- Non-2xx responses must throw with the server message, or failures render as data.
- `npm run dev` (concurrent API + Vite with proxy) gives me prod parity without needing `vercel dev`. What is left is verifying prod at `easydev-nine.vercel.app`, updating README section 5 setup, and one last responsive pass.
