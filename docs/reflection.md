# Individual reflection

**Project:** StoryNest
**Author:** Sibgha Ahmad

---

I went into this thinking the hard part would be the AI — getting Claude to
produce a story that was actually 200–250 words, wove the lesson into the
action, and didn't sound like a ChatGPT output. That turned out to be a
one-afternoon problem. The actual hard parts were everything around it.

The biggest thing I learned is that the infrastructure around Claude Code
matters as much as the prompts. `CLAUDE.md` with `@prd.md` imports meant
every session opened with full acceptance criteria in context without me
re-pasting anything. That sounds small, but it's the difference between
an agent that drifts and one that stays on-spec across ten sessions. I
should have done this from day one — I added the imports in sprint 1 only
after two sessions started producing code that didn't match the PRD, and it
fixed the problem immediately.

The route split for story generation — `POST /api/stories/generate` creates
the DB row and returns an ID, then `GET /api/stories/[id]/stream` does the
actual streaming — wasn't the original plan. I started with a naive "stream
directly from POST" approach and hit a wall: the client had no stable URL to
navigate to while tokens were arriving. The fix took an afternoon and produced
a better architecture. I've written a note in the retro about it because I
want to remember the instinct to go simple first was right; it's just that
"simple" sometimes reveals the constraint you'd otherwise miss.

Hooks were underrated. I set up a PreToolUse hook to block writes to `.env*`
and `prisma/migrations/*`, and it paid off twice in one day during sprint 2 —
once blocking an accidental `.env.local` write, once blocking a migration edit
that would have silently fabricated history. Neither incident was dramatic, but
both would have cost time to unwind. A ten-minute hook setup absorbed two
would-be incidents.

The `security-reviewer` sub-agent caught something real: a `prisma.profile.findMany`
call that had lost its `userId` filter during a multi-child refactor. That's
exactly the class of bug it was designed to catch, and it would have passed
unit tests because the tests were scoped to the right user by setup, not by
the query. I'm treating that as validation that the agent is worth the
overhead, not just box-checking.

What I'd do differently: land the Postgres migration at the start of sprint 2,
not the end. Every test suite had SQLite assumptions baked in, and rewriting
eleven suites the week before the deadline was painful and avoidable.

The TDD commit discipline — separate red, green, and refactor commits — felt
tedious the first time I did it for the sharing feature and obviously correct
by the second. The git log reads like documentation. I didn't expect to prefer
it, but I do now.

Running this solo meant I never had a second person to catch obvious mistakes,
so the agents and hooks had to fill some of that role. They mostly did.
