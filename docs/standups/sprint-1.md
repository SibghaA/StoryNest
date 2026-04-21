# Sprint 1 standups

### Sibgha — 2026-03-24

**Yesterday:** Scaffolded Next.js 15 App Router, wired Prisma with SQLite,
landed the first `CLAUDE.md` + `@prd.md` import (#1).
**Today:** Auth routes + register page, profile model (#1, #2).
**Blockers / asks:** None.

### Sibgha — 2026-03-28

**Yesterday:** Profile API + UI shipped (#2). Guest flow de-scoped to Sprint 2 to avoid auth edge cases this week.
**Today:** Story generate schema + route (#3), stubbed Anthropic client.
**Blockers / asks:** Need opinion on whether to stream from POST or split — will try POST first and document the decision.

### Sibgha — 2026-04-01

**Yesterday:** Decided to split generate/stream into two routes — the POST returns an id, the stream lives at GET /api/stories/:id/stream. Makes the URL bookmarkable, solves the "what do I navigate to while tokens are still arriving" question (#3, #4).
**Today:** Avatar builder component + profile integration (#5), then the first custom skill (#6).
**Blockers / asks:** vi.mock hoisting bit me on profile tests. Fixed by rewriting the test file. Worth a note in the testing docs.

### Sibgha — 2026-04-04

**Yesterday:** Avatar builder shipped (#5). `add-feature` skill v1 committed (#6).
**Today:** Playwright MCP wire-up (#7), sprint retro prep.
**Blockers / asks:** None — on track to close the sprint on time.
