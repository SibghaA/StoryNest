#!/usr/bin/env bash
# Vercel build entrypoint. Transforms the canonical sqlite Prisma schema into a
# postgres sibling, generates the client, syncs the DB (when DATABASE_URL is
# set), and builds Next.

set -euo pipefail

node scripts/prepare-prisma-for-postgres.mjs
npx prisma generate --schema=prisma/schema.postgresql.prisma

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma db push \
    --accept-data-loss \
    --skip-generate \
    --schema=prisma/schema.postgresql.prisma
else
  echo "[vercel-build] DATABASE_URL not set — skipping prisma db push."
  echo "[vercel-build] DB-backed routes will 500 at runtime until the env var is configured."
fi

npx next build
