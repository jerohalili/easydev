# Full Clean Setup — GitHub + Neon + Vercel

Do these in this exact order. Don't skip the checkpoints — each one confirms
the previous step actually worked before you move on.

---

## 1. GitHub — start from a clean repo

1. On GitHub, delete the old repo entirely (Settings → scroll to bottom →
   Delete this repository), OR create a brand new repo if you'd rather keep
   the old one around as a backup.
2. Create a new empty repo, no README/gitignore/license (we already have
   those).
3. On your machine, in an empty folder:
   ```
   git init
   git remote add origin <your new repo URL>
   ```
4. Unzip `easydev-fixed.zip` and copy everything **inside** the
   `easydev-fixed/` folder (not the folder itself) into this repo folder.
5. ```
   git add .
   git commit -m "Clean restart"
   git branch -M main
   git push -u origin main
   ```

**Checkpoint:** refresh the GitHub repo page in your browser — you should see
`api/`, `client/`, `server/`, `package.json`, `vercel.json`, `SETUP.md`, etc.

---

## 2. Neon — fresh database

1. Neon dashboard → create a **new project** (don't reuse the old one — a
   clean one removes any doubt about leftover partial state).
2. Once created, go to **SQL Editor** and paste the entire contents of
   `server/schema.sql`, then run it. This single file creates every table
   AND seeds all the questions/options/tech items/weights — nothing else
   needs to be run.
3. **Checkpoint** — run this in the same SQL Editor:
   ```sql
   SELECT 'questions' AS t, COUNT(*) FROM questions
   UNION ALL SELECT 'options', COUNT(*) FROM options
   UNION ALL SELECT 'tech_items', COUNT(*) FROM tech_items
   UNION ALL SELECT 'weights', COUNT(*) FROM weights;
   ```
   Expected: questions=13, options=58, tech_items=25, weights=100.
   If any of these are 0, the schema didn't run — go back to step 2.
4. Go to **Connect** (or the Connection Details panel) and copy the
   **pooled** connection string. It should look like:
   ```
   postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/<db>?sslmode=require
   ```
   Keep this tab open — you'll paste it in the next section.

---

## 3. Vercel — fresh project

1. Vercel dashboard → **Add New → Project** → import the new GitHub repo.
2. On the import screen, **Framework Preset: Other**. Leave Root Directory
   as `./` (the repo root — NOT `client/`). Do not manually set a Build
   Command or Output Directory here — `vercel.json` already defines both,
   so the fields in this screen can stay on their defaults.
3. Before clicking Deploy, expand **Environment Variables** on this same
   import screen and add:
   - Key: `DATABASE_URL`
   - Value: the pooled connection string you copied from Neon
   - Environments: check all three (Production, Preview, Development)
4. Click **Deploy**.

**Checkpoint:** once the deployment finishes, open the deployed URL and
click "Start Assessment". A project should get created and the first
question should appear. If it errors, go to **Deployments → (this
deployment) → Functions/Logs**, trigger the error again on the live site,
and read the exact error line — at that point it'll point at something
specific rather than a generic "failed to fetch."

---

## 4. If you ever need to run it locally

```
npm install
cd client && npm install && cd ..
cp .env.example .env      # then fill in DATABASE_URL with the same Neon string
vercel dev
```

`vercel dev` serves the client and the `/api` function together on one
local port, matching production exactly.
