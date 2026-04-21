---
name: Land infrastructure changes at the start of a sprint, not the end
description: CI, lint config, coverage thresholds, and DB migrations should be first-week work
type: feedback
---

Infrastructure changes (CI pipeline, ESLint config, coverage thresholds, DB migrations) must be the first things merged in a sprint, not the last.

**Why:** In sprint 2, the Postgres migration landed on the final day. Every test suite had SQLite assumptions baked in, so rewriting eleven suites under deadline pressure was painful and avoidable. The same sprint also saw an ESLint 10 transitively break `next lint` — caught only when CI was added late in the sprint.

**How to apply:** Sprint planning should list any infrastructure change as issue #1. Feature work is blocked on it, not the other way around.
