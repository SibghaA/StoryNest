#!/usr/bin/env node
// Generates prisma/schema.postgresql.prisma from the canonical sqlite schema.
// Run by Vercel's build command so dev/test can keep using SQLite files while
// prod deploys against Postgres without a second schema ever drifting.

import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'prisma/schema.prisma'
const OUT = 'prisma/schema.postgresql.prisma'

const source = readFileSync(SRC, 'utf8')

if (!/provider\s*=\s*"sqlite"/.test(source)) {
  console.error(
    `[prepare-prisma-for-postgres] expected provider = "sqlite" in ${SRC}. ` +
      `Refusing to write ${OUT}.`,
  )
  process.exit(1)
}

const transformed = source.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')

writeFileSync(OUT, transformed)
console.log(`[prepare-prisma-for-postgres] wrote ${OUT}`)
