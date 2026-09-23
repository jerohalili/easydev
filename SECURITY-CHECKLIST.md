# SECURITY-CHECKLIST — EasyDev

Filled before going public. Every row: Yes / No / N/A + one line of evidence in my own words.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 1 | .env is gitignored and is not in the repository | Yes | `.gitignore:2` lists `.env`; `git ls-files` shows only `.env.example` |
| 2 | A .env.example with placeholder values only is committed | Yes | `.env.example` has empty `DATABASE_URL=` plus comments, no real URL |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | Searched `api/`, `db/`, `client/src/` for postgres://, password, secret, key, token — only `process.env.DATABASE_URL` in `db/db.js:6,9` |
| 4 | Git history is clean: I searched git log -p for password, secret, api key and postgres:// | Yes | Ran `git log -p --all -S password -S secret -S "api key" -S postgres://`; no hits outside docs |
| 5 | Any credential that was ever committed has been rotated | N/A | No credential was ever committed; live `.env` on disk never entered git |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | Prod `DATABASE_URL` set in Vercel Project Settings → Environment Variables only |

## GitHub Actions

Project has no workflows — rows 7–11 are N/A for that reason.

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 7 | No secret value is written literally in any workflow YAML file | N/A | No `.github/workflows/` files exist |
| 8 | Secrets are stored in repository Actions secrets and read with ${{ secrets.NAME }} | N/A | No workflows to audit |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | No workflows, no runs |
| 10 | Uploaded build artifacts contain no .env, key file or generated config | N/A | No workflows; Vercel build outputs `client/dist` only |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | No workflows |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | Checked Settings → Code security after last push; both on |

## Database

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | All 29 `pool.query` calls in `api/index.js` use `$1,$2,$3`; only `${PRIMARY_BOOST_MULTIPLIER}` const 5 is interpolated |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | Neon pooled URL, password-gated + `sslmode=require` (`db/db.js:6,10`); only holder of the URL can connect |
| 15 | The database user the app connects as has only the permissions it needs | No | Neon single-owner string has full rights to this DB; mitigated by per-project DB, env-only storage, no DROP in app code |
| 16 | Seed and sample data is invented, not real people's data | Yes | `db/schema.sql:80-235` is generic tech catalog + questionnaire, no PII |
| 17 | Debug, seed and reset routes are removed before going public | Yes | `grep seed|reset|debug|drop|truncate api/` hits only a comment at `api/index.js:13`; no such routes |

## Access control

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | No | Open questionnaire demo by design; no login, JWT, or session code in `api/` or `client/src/` |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | Not used; Neon + `pg` only |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace project/README.md | N/A | No Zero Trust or app password; public-by-design demo with no private data |
| 21 | The gate covers every route, including the ones that only change data | No | `POST /projects`, `POST :id/answers`, `POST :id/score`, `DELETE :id`, `POST user-stack` take raw `:id` with no user scoping — IDOR possible, accepted for class demo |
| 22 | The credentials for the gate are environment variables, not in source | Yes | Only credential is `DATABASE_URL` via env; client uses relative `/api` (`client/src/config.js:4`), no hardcoded URLs |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 23 | Input from the user is validated on the server, not only in the browser | No | `POST :id/answers` checks non-empty only (`api/index.js:267-269`); `score`/`user-stack` rely on DB constraints, no type/FK/whitelist checks |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | React only, zero `dangerouslySetInnerHTML`/`innerHTML` in `client/`; titles/descriptions render as text nodes |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | All errors are generic `Failed to…`; `err` goes only to server `console.error`, never to the client |
| 26 | CORS is not a wildcard on routes that change data | No | `api/index.js:8` uses open `cors()`; accepted as public demo, would restrict to Vercel origin for real users |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | Searched repo + `git log`; only `github.com/jerohalili/easydev` and live URL |
| 28 | No classmate's personal data in the repository | Yes | No other people's data anywhere |
| 29 | Dependencies come from official registries, and node_modules is gitignored | Yes | `cors,dotenv,express,pg` + React/Vite/Tailwind from npm; `node_modules/` gitignored + untracked |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | Phosphor icons (MIT), Vite/React SVGs, own `hero.png`/favicon |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | Public by intent for grading; visibility re-checked after final push |

## Anything I found and fixed

This checklist caught that my open `cors()` and unauthenticated `:id` mutations (IDOR) were never written down — I knew but hadn't documented them. I kept them as honest No rows for a class demo instead of claiming security, and confirmed all user-input queries use `$1` parameters with no stack-trace leaks.
