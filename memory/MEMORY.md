# Project memory index

Auto-memory for StoryNest. Each entry is a persistent note saved across Claude Code sessions.

## Project context

- [Stack and deployment](project_stack.md) — Next.js 15, Prisma, Vercel, fal.ai, Anthropic SDK streaming
- [Story generation split](project_generate_split.md) — Why generate and stream are two separate routes
- [Auth scoping invariant](project_auth_scoping.md) — Every DB query must scope to session.user.id
- [sanitize() choke point](project_sanitize_choke_point.md) — All user input into Claude prompts goes through sanitize()
- [fal.ai latency debt](project_fal_latency.md) — Observed p95 ~15s; illustrations are non-blocking by design
- [ESLint v8 pin](project_eslint_pin.md) — ESLint pinned to v8; ESLint 10 breaks next lint

## Feedback and workflow rules

- [TDD commit discipline](feedback_tdd_commits.md) — Red, green, refactor are three separate commits; never squash
- [Typecheck gate](feedback_typecheck_gate.md) — Every session must pass tsc + vitest before closing
- [Test DB isolation](feedback_test_db_isolation.md) — Each suite uses its own SQLite file; never share test.db
- [Infrastructure first](feedback_infrastructure_first.md) — CI, lint, DB migrations land at sprint start, not end
