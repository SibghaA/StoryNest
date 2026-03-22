# Reflection: Building StoryNest with Claude Code

## How Explore → Plan → Implement → Commit Changed My Workflow

Before using Claude Code, my typical approach was to jump straight into implementation — open a file, start writing code, fix whatever broke, repeat. The process was fast to start but often slow to finish, because I would discover structural issues mid-implementation and have to backtrack. Planning felt like overhead, so I skipped it.

The Explore→Plan→Implement→Commit pattern forced a different discipline, and the difference was most visible when implementing user profiles. Rather than immediately writing route handlers, the session began with Claude reading the existing codebase to understand what scaffold existed (almost nothing at that point) and what was implied by the PRD. This Explore phase surfaced a concrete blocker before a single line of application code was written: there was no `package.json`, no Prisma schema, no `.env.local`. Without the upfront exploration, I would have written the profile API against assumptions that didn't match reality and hit runtime errors instead of a coherent plan.

The Plan phase, used explicitly before the profiles feature, also changed what got built. Claude proposed scope clarification — backend only, no frontend yet — which kept the session focused. In my old workflow, I would have drifted into building UI while the backend was still incomplete, splitting my attention and producing a half-finished version of both.

The Commit phase reinforced something I often neglect: commit messages as a record of intent, not just a record of change. Commits like `Add tests for the Sharing Stories features (will use TDD + Claude to implement the rest)` and `refactoring after all tests pass` tell the story of the TDD cycle. Reading the git log now, I can reconstruct exactly what happened and why — something that would have been impossible with my usual `wip` or `fix stuff` messages.

The main trade-off is speed at the start. The workflow feels slower in the first 10 minutes because you are reading and planning instead of building. But the total time to a working, tested feature was shorter because there was almost no rework.

## Context Management Strategies

Context limits were a real constraint during this project. The session log shows two points where the conversation ran out of context and had to be continued with a compacted summary. A few strategies made this manageable.

**`/compact` over `/clear`.** When context grew large, using `/compact` preserved the accumulated understanding of the codebase in condensed form rather than discarding it. The compacted summaries (visible in the session log) captured file contents, key decisions, and error resolutions — enough for a resumed session to pick up without re-reading everything.

**CLAUDE.md as persistent context.** The most effective strategy was investing in a comprehensive CLAUDE.md early. Architectural decisions like "avatar stored as flat JSON on Profile, not a separate table," the SQLite→PostgreSQL migration path, and the no-Prisma-mocks testing rule were written into CLAUDE.md during the first session. Every subsequent session loaded that context automatically, so I never had to re-explain the project's constraints. The `@prd.md` import further extended this — Claude always had access to acceptance criteria without me repeating them.

**Scoped sessions for scoped features.** Keeping each session focused on one feature (auth + profiles, then story generation, then sharing) meant context stayed relevant. Cross-feature sprawl would have exhausted the window faster and produced noisier compacted summaries.

## Annotated Session Log Excerpt

```
[19:09] "I want to implement the story generation API. How could we go about doing that?"
  → EXPLORE: Claude reads codebase, finds no application code yet — only docs
  → PLAN: Designs three-file approach (schemas.ts, prompt.ts, route.ts) before writing any code
  → IMPLEMENT: Creates all three files; notes what external files (lib/auth.ts, lib/prisma.ts)
               must exist before the route will run
  → COMMIT: 00ab2574 "Implement Story Generation API, with prompt and schema enforcement"

[19:21] "Let's implement user profiles."
  → EXPLORE: Reads codebase state, confirms scaffold files exist from prior session
  → PLAN: Explicitly enters plan mode; scopes to backend only; lists migration steps
  → IMPLEMENT: Scaffold → schema → auth → routes → tests; hits vi.mock hoisting bug,
               diagnoses and rewrites test file rather than patching around it
  → COMMIT: 02a23983 "Implemented backend user profiles, with full authentication"

[TDD cycle for Sharing Stories]
  → eaa09851: Tests written first (red)
  → 72f5027c: GET implementation passes tests (green)
  → 2fb0a5eb: POST implementation added (green)
  → 783ae653: Refactor pass after all tests pass (refactor)
```

The pattern that surprised me most was how naturally Claude Code enforced the workflow. Asking "how should we go about this?" consistently triggered an Explore→Plan response before any code appeared, which aligned exactly with the intended process.
