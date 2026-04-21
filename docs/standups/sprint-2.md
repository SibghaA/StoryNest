# Sprint 2 standups

### Sibgha — 2026-04-08

**Yesterday:** Illustrations pipeline + scene extractor (#8). fal.ai integration via `fal-ai/flux/schnell`; per-scene failures swallowed so the story remains readable.
**Today:** Story library — save / browse / delete (#9).
**Blockers / asks:** fal.ai latency is higher than PRD target (~15s is the observed p95). Adding it to the open-questions list for post-launch.

### Sibgha — 2026-04-11

**Yesterday:** Library shipped (#9). Sharing feature started with TDD — test file first: `eaa09851`. Tests are red as expected.
**Today:** Implement GET then POST for sharing (#10).
**Blockers / asks:** None.

### Sibgha — 2026-04-14

**Yesterday:** Sharing done, four commits, TDD trail intact. Multi-child stories landed (#11) — `profileIds` + optional `relationship` threaded through the prompt builder.
**Today:** CI pipeline (#12) + Gitleaks + `security-reviewer` agent (#13).
**Blockers / asks:** ESLint 10 transitively broke `next lint`. Diagnosing.

### Sibgha — 2026-04-16

**Yesterday:** CI pipeline green: lint, typecheck, unit, audit, gitleaks, build. ESLint pinned to 8. Hooks in place (#14). `.mcp.json` + `create-pr` skill + `add-feature` v2 committed (#15).
**Today:** Postgres migration + Vercel deploy (#16). Worktree setup for guest flow + Blob re-hosting (#17, #18).
**Blockers / asks:** Postgres migration is more invasive than expected — test suites assume SQLite. Will document the migration path even if tests lag a day.

### Sibgha — 2026-04-19

**Yesterday:** Vercel preview deploys working. Guest flow shipped from `feat/guest-flow` worktree; Blob re-hosting from `feat/blob-rehost` worktree (#17, #18). Both TDD: red → green → refactor.
**Today:** Writer/reviewer PRs (#19), blog post + video demo (#20), final retro.
**Blockers / asks:** None — on track to close the sprint today.
