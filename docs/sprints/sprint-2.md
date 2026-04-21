# Sprint 2 — Production readiness

**Window:** 2026-04-06 → 2026-04-20 (2 weeks)
**Theme:** Take the working core from Sprint 1 and ship it: illustrations,
library, sharing, multi-child, and the full Claude Code / CI / security stack.

---

## Planning (2026-04-06)

### Goals
1. Illustrations pipeline (fal.ai `flux/schnell`, up to 3 per story, non-blocking).
2. Story library per profile + save/delete.
3. Multi-child stories with relationship field.
4. Sharing stories with another user.
5. Full CI/CD: lint, typecheck, tests, coverage, audit, gitleaks, deploy.
6. Security hardening: Gitleaks, sub-agent review, DoD, OWASP mapping.
7. Claude Code mastery: second skill, agent, hooks, `.mcp.json` in repo.
8. Parallel development via git worktrees (guest flow + Blob re-hosting).

### Committed issues
| # | Title | Size | Owner |
|---|---|---|---|
| 8 | Illustration pipeline + scene extractor | M | Sibgha |
| 9 | Save / browse / delete story library | M | Sibgha |
| 10 | Sharing stories (GET + POST) — TDD | M | Sibgha |
| 11 | Multi-child stories (profileIds: 1–5 + relationship) | M | Sibgha |
| 12 | CI pipeline — all 8 stages | L | Sibgha |
| 13 | Security: Gitleaks + `security-reviewer` agent + OWASP in CLAUDE.md | M | Sibgha |
| 14 | Hooks: PreToolUse (protected files) + Stop (typecheck + tests) | S | Sibgha |
| 15 | `.mcp.json` + second skill (`create-pr`) + `add-feature` v2 | S | Sibgha |
| 16 | Postgres migration + Vercel production deploy | M | Sibgha |
| 17 | Guest flow (parallel worktree) — TDD | M | Sibgha |
| 18 | Vercel Blob re-hosting (parallel worktree) — TDD | M | Sibgha |
| 19 | Writer/reviewer PRs x2 with C.L.E.A.R. + AI disclosure | S | Sibgha |
| 20 | Blog post + video demo | M | Sibgha |

### Out of scope
- Google OAuth (stack documents it; backlog item for v2).
- Audio narration (PRD non-goal for v1).

### Risks
- Postgres migration mid-sprint may destabilize tests (SQLite-specific assumptions).
- fal.ai rate limits are unknown (PRD open question #1); plan is to ship with
  per-scene error fallback and observe.

---

## Retrospective (2026-04-20)

### What went well
- **Sharing stories was shipped on rails.** The TDD commit pattern
  (`eaa09851` → `72f5027c` → `2fb0a5eb` → `783ae653`) made the git log
  readable as a story: here's what we promised, here's the GET, here's the
  POST, here's the cleanup. Four commits, four intentions.
- **`security-reviewer` sub-agent was a real tool, not theater.** First time
  running it on the multi-child PR, it caught a `prisma.profile.findMany`
  call that had lost its `userId` filter during a refactor. Exactly the
  class of bug the agent was designed for.
- **PreToolUse hook paid for itself twice in one day.** Once blocking an
  accidental `.env.local` write, once blocking a migration edit that would
  have fabricated history.
- **`add-feature` v1 → v2 migration improved real sessions.** v1's TDD
  assumption (tests always start red) failed when backfilling coverage on
  existing code. v2's "new-logic vs. coverage-gap" distinction resolved
  the confusion of "why are my tests green before I've implemented anything".

### What hurt
- **ESLint 10 ambush.** Worked locally, broke CI. Cost an hour to diagnose
  that `next lint` invokes ESLint with removed options. Pinned to ESLint 8.
- **Generate E2E spec drifted.** The UI added a scenario picker mid-sprint
  and the Playwright spec wasn't updated. Caught in CI. Moved E2E from PR
  gate to main-only gate until spec is refreshed.
- **Postgres migration was more invasive than expected.** The test suite
  assumed SQLite fixtures; each of the 11 suites needed the same rewrite.
  Should have landed the migration at the start of the sprint, not the end.

### What we're taking forward
- **Land infrastructure first.** CI, lint, coverage thresholds, and the DB
  migration should be first-week work. Sprint 2 did the opposite and paid.
- **Every new UI feature ships with its E2E test in the same PR.** No more
  "will add the test next PR".
- **AI disclosure % is rarely precise.** Most PRs landed in the "~70%"
  bucket. The % itself mattered less than the "Human review applied" line,
  which kept reviewers honest.

### Velocity
- Planned: 13 issues
- Completed: 13. Two (#16 Postgres, #20 blog/video) slipped to the final day
  but landed.

---

## Where to find the evidence

| Deliverable | Location |
|---|---|
| Skills | `.claude/skills/{add-feature.md, add-feature-v1.md, create-pr.md}` |
| Agent | `.claude/agents/security-reviewer.md` |
| Hooks | `.claude/settings.json` + `.claude/hooks/` |
| MCP | `.mcp.json` |
| CI | `.github/workflows/{ci,claude-review,deploy}.yml` |
| Security | `.gitleaks.toml`, `docs/security.md`, `docs/definition-of-done.md` |
| Writer/Reviewer | `.claude/skills/create-pr.md`, PR history for sprint 2 |
| Worktrees | `docs/worktrees.md` + the `feat/guest-flow` and `feat/blob-rehost` branches |
| Reflections | `reflections.md`, `retrospective.md` |
| Blog / video | `docs/blog-post.md`, `docs/video-script.md` |
