# EasyDev Weekly Increment Report

Project: EasyDev — Tech Stack Identifier
Repo: https://github.com/jerohalili/easydev
Live: https://easydev-nine.vercel.app/
Status: Almost complete — maintenance / polish mode, still touched sometimes.


---

## Week 1 — August 15-22, 2026: MVP sprint (57 commits)

### What changed this week

#### Base + questionnaire

- Initial build (`0c363bb build: initial project`, `c924004 Rename project to 'easydev'`): React + Vite + Express + Postgres questionnaire app skeleton.
- Questionnaire UI + branching (`7179681 feat: improve ui/ux and content`, 497+/281- across `App.jsx`, `QuestionCard.jsx`, `ProgressBar.jsx`, `ResultsView.jsx`, `server/index.js`, `server/schema.sql`): question screens, back-navigation cache, review screen, `next_question_id` branching.

#### Scoring engine

- Scoring engine (`e23f4da fix: recomendation scoring`, `4b7c37a fix: test new scoring sys`, `server/seed.sql` 91+): weighted-sum per category (language/frontend/backend/database/infrastructure) with reasoning text.

#### Comparison / history / multi-select

- Comparison view (`40adfb1 feat: comparison feature`).
- Multi-select (`879d9a1 feat: multi select initial`).
- History + light mode + options (`b0c7c10`), questionnaire fixes (`474fe67 fix: questionaire`, `19f8f38 fix: minor bugs`).

#### Deploy

- `179971e feat: vercel support` (`vercel.json`), `bda277d feat: readme`, live link `511f75d`.
- Vercel/Neon hardening (`1294024`, `bdfc7da`, `cdfae30`, `a8b35af`, `bebb7cd fix: vercel deploy`, `98e259f fix: remove local, focus vercel and neon`).

#### Styling baseline

- `856e6e6 feat: tailwind css`, `273dcc5 feat: crimson style`, `9bb496e feat: styled icons`.
- `e5b6c39 feat: responsiveness`, `dc5e4dc feat: responsive and style`, `9415ced chore: clean up and finalize`.

#### Smarter-system pass (Aug 17-18)

- `8c01a57 feat: smarter system`, `66cf868 fix: better questions`, `fdbe74f fix: better choices`, `a2b24b8 fix: clean up and fix new server`, `a0d5f20 feat: add content`.

### Why

- I went schema-first: I made questions, options, branching, tech items, and the weight matrix work before UI polish, because I wanted a decision engine (weighted constraints), not a lookup table or hardcoded if/else chain.
- I chose a single Vercel deploy (client + `/api` serverless fn) + Neon Postgres because I wanted to avoid managing separate servers and CORS, even though it forced me to fit my Express shape into a serverless function.

### What broke or what I got stuck on

- **Scoring mis-rank:** I broke ranking when incidental answer points outranked explicit picks; I fixed it later with `PRIMARY_BOOST_MULTIPLIER = 5` (`api/index.js:40-48`).
- **Empty layers:** I shipped zero-picks when all-"I don't know" layers scored zero; I fixed it later with `SAFE_DEFAULTS` (`api/index.js:17-24`).
- **Contradictions missed:** I let Q3 wording slips e.g. realtime + no-backend-logic through silently; I fixed it later with `CONTRADICTION_RULES` (`api/index.js:52-69`).
- **Thin wins committed silently:** I committed "no layer needed" wins on tiny margins; I fixed it later with `CONFIDENCE_MARGIN_THRESHOLD = 6` (`api/index.js:81`).
- **Vercel deploy loop:** I broke prod 5 times in one day with 5x `fix: vercel server` because my standalone Express shape did not map to a serverless function and my local-only code kept breaking prod; I fixed it by committing to Vercel + Neon and deleting my local-only paths (`98e259f`).
- **Styling cascade:** I broke styles repeatedly (`bdf9577`, `b2bfa1d`, `81043d4 fix: broken style(s)`, `f3667e0 fix: history view`) because my Tailwind v4 layered over custom CSS-variable theming (`--bg-main`, `data-theme`) drifted per component.

### What is left

- I still had UI polish, a shared design spec, migration leftovers, and clearer error copy left, which I covered in Weeks 3-5.


---

## Week 2 — August 23-29, 2026: quiet week (1 commit)

### What changed this week

- `721a297 Update live website URL in README` — docs only.

### Why

- I only updated the live website URL in the README because I wanted to keep the live link correct; I did no feature work that week.

### What broke or what I got stuck on

- I had nothing active and I got stuck on nothing; I treated it as a gap week between my MVP and polish pass.

### What is left

- I still had UI/interactivity polish to do, which I did next week.


---

## Week 3 — August 30 - September 5, 2026: UI/UX polish (15 commits)

### What changed this week

#### Cleanup + interactivity

- `d01f59e fix: clean up and UI`, `e02ab04 feat: better UI design`, `6870240 feat: better interactivity`.

#### Hover + buttons

- Hover system (`95ae0a9`, `d9effc2`, `c751ad3 fix: better hover effects`).
- Buttons (`0c9ae5b`, `015343e fix: better button design`, `072830e feat: buttons hover style`).
- Dark-mode button hover (`988dc61`).

#### Borders + spacing

- `dbcad43 fix: better border light mode`, `891dbe3`, `38d2f3f fix: minor spacing`.

#### Favicon

- `cdd038a fix: favicon`, `8cce1b8 fix: favicon color`.

### Why

- I prioritized borders, hover affordances, and button/dark-mode consistency next because my MVP was functional but flat: light-mode borders washed out and my toggle felt inconsistent, and I wanted a readable theme-aware UI for junior users across every screen.

### What broke or what I got stuck on

- **Badge map drift:** I let my Comparison vs Results views diverge (noted in `client/src/categoryStyles.js:2` — "drifted once, looked broken"); I saw I needed a shared `CATEGORY_STYLES` map.
- **No single token:** I got stuck doing per-component fixes for my light-mode borders and dark-mode hovers with no single token; I decided I needed the Week 4 design system.
- **CSS-only week:** I made no backend changes, which confirmed to me that my stuck points were theming, not my data model.

### What is left

- I still had to lock tokens/components in a shared design spec, which I did in Week 4, and finalize my backend migration, which I did in Week 5.


---

## Week 4 — September 6-12, 2026: design system (2 commits)

### What changed this week

- `1626ff5 feat: design system` — new `DESIGN-SYSTEM.html` (1212 lines): tokens, app shell, cards, badges, buttons, focus ring, animations.
- `dcc6aac feat: update design system` — revisions to same spec.

### Why

- I built the visual contract first because I wanted one file (spacing, `outline: 2px solid var(--primary-accent)`, `fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)`, theme transitions) to check every screen against before my final pass.

### What broke or what I got stuck on

- I over-documented my first spec pass (verbose Page Structure, Focus Ring demo, Component File Locations sections); I fixed it the following week in `086dd75` (58 deletions) by trimming it into compact code blocks.

### What is left

- I still had to apply my spec consistently, finalize my backend migration, and clarify user-facing errors, which I did in Week 5.


---

## Week 5 — September 13-19, 2026: migration finalize + DX (4 commits)

### What changed this week

#### Design trim

- `086dd75 fix: design system consistency` — `DESIGN-SYSTEM.html` 10+/58-: removed Page Structure / Focus Ring / Component Locations sections, condensed Animation to one block.

#### Migration finalize

- `8ac6034 fix: remove leftovers, finalize migration` — 37+/225- across 9 files: deleted standalone-Express leftovers from `api/index.js`, trimmed `App.jsx` / `ComparisonView.jsx` / `HistoryView.jsx` / `QuestionCard.jsx` / `ResultsView.jsx` / `config.js`, condensed `db/schema.sql` comments (`is_unsure`, `experience_level`, `needs_confirmation`) to one-liners.

#### Popups + rename

- `6017d02 fix: better pop up messages` — 326+/281- across 11 files.
- Rename for clarity (`history`→`proposalPath`, `results`→`stackPicks`, `warnings`→`proposalFlags`, `projectId`→`proposalId`, handlers `startProposal` / `fetchQuestionnaireStep` / `submitProposalAnswer`).
- Rewrote user-facing errors (`Couldn't open "<title>" proposal...`, `Couldn't save that questionnaire answer...`).
- `client/src/config.js:9-28` `res.ok` guard + server-message surfacing, contradiction-flag copy.

#### Local dev

- `a5d17be fix: reimplement better local dev` — 354+/7- across 6 files.
- New `local-server.js` (require `api/index.js`, listen 3001).
- `client/vite.config.js:7-12` `/api`→`localhost:3001` proxy.
- Root `package.json:5-10` `concurrently` scripts (`dev`, `dev:api`, `dev:client`, `dev:vercel`).
- `db/db.js:6` SSL only when `sslmode=require` + `dotenv quiet:true`.

### Why

- I kept client + API as one Vercel unit (`vercel.json` rewrites `/api/*`→fn, rest→`index.html`) because I wanted no CORS or env-specific base URLs (`API_BASE = '/api'`).
- I made non-2xx responses throw with the server message because I had silently rendered 500s as picks — `fetch` only throws on network failure — and I wanted failures to surface instead.
- I built `npm run dev` (concurrent API + Vite with proxy) because I wanted prod parity without requiring `vercel dev`.

### What broke or what I got stuck on

- **SSL broke local dev:** I broke local connect by forcing SSL everywhere — my local Postgres URL has no `sslmode=require` (`db/db.js:4-6`, "Got burned once by forcing SSL everywhere"); I fixed it by enabling SSL only when `sslmode=require` is set.
- **Progress bar jumped:** I assumed a fixed length of 9, so I made it jump backwards on branching skip paths (`App.jsx`, "My first progress bar hardcoded 9..."); I fixed it by using `remaining_steps` from my DB.
- **Errors rendered as picks:** I got burned by showing 500 payloads as recommendations (`client/src/config.js:6-8`, "I got burned by silently rendering an error payload as a stack pick"); I fixed it with my `res.ok` guard and server-message surfacing.
- **Back felt broken:** I blanked answers on navigation (`QuestionCard.jsx:9`, "blanking their answer on Back felt broken"); I got stuck again when editing an early answer left a stale forward branch (Q1 project-type change invalidates my path), so I discard forward history and rebuild it.
- **Lingering leftovers:** I left migration leftovers in place for weeks after my Vercel switch; I fixed it in one pass with my final cleanup removing ~225 lines.

### What is left

- I consider my project almost complete. I still have to verify my production deploy post-migration at `easydev-nine.vercel.app`, update my README §5 setup (`vercel dev` vs `npm run dev`), and do one final responsive pass. I have no known blockers; anything after that is small touches.
