# Sprint 1 — Foundation & Core Loop

**Window:** 2026-03-22 → 2026-04-05 (2 weeks)
**Theme:** Get a parent from "landing page" to "streaming personalized story" with a saved child profile.

---

## Planning (2026-03-22)

### Goals

1. Project scaffold: Next.js 15 App Router, Prisma, NextAuth, Tailwind.
2. Auth (email/password) + child profile CRUD, 5-profile cap.
3. Story generation API + streaming UI.
4. Avatar builder (skin tone, hair color, hair style).
5. Claude Code infrastructure: CLAUDE.md, first custom skill, Playwright MCP.

### Committed issues

| #   | Title                                            | Size | Owner  |
| --- | ------------------------------------------------ | ---- | ------ |
| 1   | Scaffold Next.js + Prisma + NextAuth             | S    | Sibgha |
| 2   | Create/update/delete child profiles API + UI     | M    | Sibgha |
| 3   | `POST /api/stories/generate` with Zod validation | M    | Sibgha |
| 4   | Claude streaming via `ReadableStream`            | M    | Sibgha |
| 5   | Avatar builder component + profile integration   | M    | Sibgha |
| 6   | Add `add-feature` custom skill                   | S    | Sibgha |
| 7   | Wire up Playwright MCP server                    | S    | Sibgha |

### Out of scope this sprint

- Illustrations (moved to sprint 2).
- Story library (moved to sprint 2).
- Sharing (moved to sprint 2).
- Postgres migration (moved to sprint 2).

### Risks

- Streaming contract between Claude SDK and Next.js `ReadableStream` is novel
  territory — might require spiking before estimating.
- NextAuth + Prisma adapter needs real env vars locally; onboarding friction.

---

## Retrospective (2026-04-05)

### What went well

- `CLAUDE.md` investment paid off immediately. The `@prd.md` import meant every
  session had full acceptance criteria in context without re-explanation.
- Splitting story generation into `POST /api/stories/generate` (creates row) +
  `GET /api/stories/[id]/stream` (streams tokens) let the client navigate to a
  stable URL before the stream started. This was not the original plan —
  discovered mid-implementation when the naive "stream directly from POST" approach
  made it impossible to render a URL the parent could bookmark.
- Playwright MCP integration uncovered an auth-redirect bug during refactor that
  Vitest would not have caught (the bug lived in middleware, not the route).

### What hurt

- `vi.mock` hoisting bit us twice on profile tests. Eventually rewrote the test
  file instead of patching around it.
- ESLint 10 pulled in transitively by something — broke `next lint` in a way
  that only surfaced when CI was added (sprint 2). Pinning to ESLint 8 fixed it.
- Two sessions ran out of context because we were reading giant session logs
  inline. Fixed by moving long-form history out of CLAUDE.md into `@prd.md`
  imports.

### What we're taking forward

- **Red-green-refactor as separate commits.** Shared Stories (sprint 2) will
  follow this explicitly; compare git log with `00ab2574` (one big commit for
  generate API) to see the difference.
- **Every custom skill ends with a typecheck + test gate.** Added to v2 of
  `add-feature` after a skipped typecheck merged a `null` bug to main.
- **Playwright spec for every new form.** Auth spec exists; generate spec is
  sprint 1's exit criterion.

### Velocity

- Planned: 7 issues
- Completed: 7 (one — #7 Playwright MCP — slipped to end of sprint but still within window)
