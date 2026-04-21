# Deployment

Target: Vercel, production Postgres, preview deploys per PR.

## First-time setup

### 1. Provision Postgres

Pick one. Neon is the default recommendation because Vercel ships a first-class
integration and the free tier is generous.

- **Neon** — https://neon.tech → create project → copy the pooled connection string.
- **Vercel Postgres** — Vercel dashboard → Storage → Create → Postgres.
- **Supabase** — https://supabase.com → project settings → database → connection string (direct, not pooler, for migrations).

Capture two URLs:

- `DATABASE_URL` — pooled connection, used at runtime.
- `DIRECT_URL` — direct (non-pooled) connection, used only by `prisma migrate`.

### 2. Switch the Prisma provider

```diff
 datasource db {
-  provider = "sqlite"
-  url      = env("DATABASE_URL")
+  provider  = "postgresql"
+  url       = env("DATABASE_URL")
+  directUrl = env("DIRECT_URL")
 }
```

Then:

```bash
rm -rf prisma/migrations          # legacy SQLite migrations do not apply to PG
npx prisma migrate dev --name init  # creates the first PG migration
```

**Local dev alongside this:** run Postgres locally with `docker compose up -d`
(see `docker-compose.yml`). The local DB lives in a Docker volume and matches
the Prisma schema exactly.

### 3. Wire up Vercel

```bash
npm i -g vercel
vercel link         # creates .vercel/project.json — do not commit it
vercel env pull     # populates .env.local from Vercel project env
```

Then in the Vercel dashboard, set these project env vars for **Production**
and **Preview**:

| Key                     | Source                                 |
| ----------------------- | -------------------------------------- |
| `DATABASE_URL`          | Postgres provider                      |
| `DIRECT_URL`            | Postgres provider (direct, non-pooled) |
| `NEXTAUTH_URL`          | e.g. `https://storynest.vercel.app`    |
| `NEXTAUTH_SECRET`       | `openssl rand -base64 32`              |
| `ANTHROPIC_API_KEY`     | https://console.anthropic.com          |
| `FAL_AI_KEY`            | https://fal.ai/dashboard               |
| `BLOB_READ_WRITE_TOKEN` | Vercel Storage → Blob                  |

### 4. Wire up GitHub Actions secrets

In the GitHub repo settings → Secrets and variables → Actions:

| Secret              | Used by                                                      |
| ------------------- | ------------------------------------------------------------ |
| `VERCEL_TOKEN`      | `.github/workflows/deploy.yml`                               |
| `VERCEL_ORG_ID`     | `.github/workflows/deploy.yml` (from `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | `.github/workflows/deploy.yml` (from `.vercel/project.json`) |
| `ANTHROPIC_API_KEY` | `.github/workflows/claude-review.yml`                        |

## Deploy cadence

- **Every PR** → `deploy.yml` → Vercel preview deploy → URL posted as a PR comment.
- **Every merge to `main`** → `deploy.yml` → Vercel production deploy.
- Migrations run automatically because `vercel build` invokes `prisma generate`
  and `prisma migrate deploy` via the `postinstall` / `build` hook
  (see `package.json::scripts.build`).

## Rollback

Vercel keeps every deploy. To roll back: Vercel dashboard → Deployments →
click the last good deploy → "Promote to Production". Migrations are
forward-only; if a migration is the problem, write a compensating migration
rather than rolling back the DB.

## Local → production parity

- Local dev uses Postgres via Docker, not SQLite. The old SQLite setup is
  gone — keeping two databases in sync across schema changes cost more than
  running a container.
- `.env.example` documents every env var that prod expects.
- The CI pipeline (`.github/workflows/ci.yml`) runs against the same Node
  version (20) that Vercel uses.
