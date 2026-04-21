# Deployment

Target: Vercel, production Postgres, preview deploys per PR.

## How the two database providers coexist

- `prisma/schema.prisma` is the canonical schema; provider is `sqlite`. Used
  for `npm run dev`, every Vitest suite, and every Playwright E2E.
- `prisma/schema.postgresql.prisma` is generated at Vercel build time by
  `scripts/prepare-prisma-for-postgres.mjs` — it is identical except
  `provider = "postgresql"`. Gitignored; never hand-edited.
- Vercel `buildCommand` (see `vercel.json`) runs the script, generates a
  Prisma client against the Postgres schema, syncs the DB, then builds Next.

This keeps unit tests fast (SQLite files, no containers) while prod gets a
real Postgres. Schema drift is impossible — the Postgres file is derived
from the SQLite one on every build.

## First-time setup

### 1. Provision Postgres

Pick one. The free tiers on each are enough for this project:

- **Neon** — https://neon.tech → create project → copy the connection string.
- **Vercel Postgres** — Vercel dashboard → Storage → Create → Postgres
  (auto-injects `DATABASE_URL`).
- **Supabase** — https://supabase.com → Settings → Database → connection string.

Capture the connection string as `DATABASE_URL`.

### 2. Wire up Vercel env vars

In the Vercel dashboard, set these for **Production** and **Preview**:

| Key                     | Source                                   |
| ----------------------- | ---------------------------------------- |
| `DATABASE_URL`          | Postgres provider                        |
| `NEXTAUTH_URL`          | e.g. `https://story-nest-two.vercel.app` |
| `NEXTAUTH_SECRET`       | `openssl rand -base64 32`                |
| `ANTHROPIC_API_KEY`     | https://console.anthropic.com            |
| `FAL_AI_KEY`            | https://fal.ai/dashboard                 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Storage → Blob                    |

Or via CLI:

```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ...etc
```

### 3. Wire up GitHub Actions secrets

GitHub repo → Settings → Secrets and variables → Actions:

| Secret              | Used by                                                      |
| ------------------- | ------------------------------------------------------------ |
| `VERCEL_TOKEN`      | `.github/workflows/deploy.yml`                               |
| `VERCEL_ORG_ID`     | `.github/workflows/deploy.yml` (from `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | `.github/workflows/deploy.yml` (from `.vercel/project.json`) |
| `ANTHROPIC_API_KEY` | `.github/workflows/claude-review.yml`                        |

## Deploy cadence

- **Every PR** → Vercel preview deploy → URL posted as a PR comment.
- **Every merge to `main`** → Vercel production deploy.
- Schema sync runs automatically in `buildCommand` via
  `prisma db push --accept-data-loss --skip-generate`. This is safe for
  StoryNest today because we have no production data yet. **Before the
  first real user signs up**, swap `db push` for a proper
  `prisma migrate deploy` wired to committed migration files.

## Rollback

Vercel keeps every deploy. To roll back: Vercel dashboard → Deployments →
click the last good deploy → "Promote to Production". Schema changes are
forward-only at the moment; if a schema change is the problem, write a
compensating change to `schema.prisma` rather than rolling the DB back.

## Local development

Dev still runs on SQLite — fastest feedback loop:

```bash
cp .env.example .env.local
# edit .env.local, set DATABASE_URL=file:./prisma/dev.db
npx prisma db push
npm run dev
```

If you want Postgres locally too (e.g. to debug a Postgres-specific issue),
`docker-compose.yml` spins up Postgres 16 on port 5432. Point
`DATABASE_URL` at `postgresql://storynest:storynest@localhost:5432/storynest`
and run the same prepare script:

```bash
docker compose up -d
node scripts/prepare-prisma-for-postgres.mjs
npx prisma db push --schema=prisma/schema.postgresql.prisma
```
