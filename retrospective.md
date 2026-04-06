# StoryNest — Claude Code Retrospective

---

## 1. How the Custom Skill Changed My Workflow

Before writing the `add-feature` skill, feature work was loosely structured: I would paste some context, ask Claude to build something, and iterate reactively when things broke. The skill replaced that with a seven-step protocol — Pick → Read → Audit → Tests → Implement → Typecheck → Mark done — that runs identically every time.

The biggest practical shift was the **audit step**. The skill requires reading existing files before writing a single line of code, and printing a short inventory of what already exists versus what is missing. This sounds obvious, but in practice I had been skipping it. When building the avatar builder, the audit revealed that `ProfileForm` had already inlined 40 lines of avatar-related JSX that needed to be extracted, not rewritten. Without the audit I would have built a second avatar implementation from scratch and had a collision to resolve later. With it, the session started with a clear scope: extract what exists, test the extractable logic, fill in what is genuinely missing.

The skill also made the **red/green cycle** explicit and non-negotiable. Rule: run tests before implementing, expect them to fail, then implement to make them pass. This sounds like standard TDD but the rule in the skill is sharper than that — it distinguishes between tests for new logic (expect red) and tests for existing logic with no coverage (may go straight to green, and that is fine). That distinction eliminated the confusion of "why are my tests passing before I've written anything?" and let the cycle stay honest.

What became noticeably easier: scoping conversations. Every session started by running `TaskList`, printing "Working on Task #N", and reading the acceptance criteria. This replaced a recurring friction point where I would finish a session unsure whether I had actually satisfied the original requirement. The task system enforced closure.

What the skill could not fix: itself running astray on multi-file sessions where context grew large. When that happened, the skill's rules were the first thing to compress away. That is a context management problem, not a skill design problem — but it is worth noting.

v1 of the skill can be found in .claude/skills/add-feature-v1.md to show the changes.

---

## 2. What MCP Integration Enabled

Before MCP, the test suite covered route handlers (via Vitest, calling handlers directly) and utility logic (prompt builders, Zod validators). There was no way to test what actually rendered in the browser, which meant the gap between "API returns the right JSON" and "the user sees the right thing" was untested and invisible.

The Playwright MCP server closed that gap. What it enabled concretely:

**Real session-aware testing.** The generate spec seeds a user and child profile directly into `prisma/dev.db`, logs in through the actual NextAuth UI, navigates to `/generate`, and exercises the form. This is a qualitatively different test from anything Vitest can produce — it exercises the cookie jar, the session middleware, the redirect on unauthenticated access, and the rendered page all in one sequence. When the auth guard broke during a refactor, the Playwright test caught it immediately. A unit test would not have, because the auth guard lives at the middleware layer, not in the route handler.

**UI validation that doesn't require jsdom.** The project explicitly has no RTL/jsdom setup (components stay dumb; logic that needs to be tested is exported as functions). Playwright gave a second testing track: instead of fighting with jsdom to render React components, the E2E tests navigated the running app and asserted on rendered text. The lesson-preset chips, the word counter, the streaming story display — these were verifiable from the outside without any component-rendering setup.

**Live debugging.** During the story generation session, I could point the MCP browser at `localhost:3000/generate`, watch the streaming output arrive token by token, and take a screenshot when the layout broke on mobile widths. This replaced a round-trip of: run dev server, open browser manually, reproduce the state, describe what I see to Claude. With MCP, Claude could see it directly.

What MCP did not replace: the Vitest integration tests. The Playwright tests are slower and depend on a running server, so they sit in a separate `e2e/` directory and are run deliberately rather than on every save. The fast feedback loop for API logic still belongs to Vitest.

The screenshot for the playwright MCP is at playwright-mcp.png in this repo.
---

## 3. What I Would Build Next

**Hooks — specifically a pre-generate validation hook.** Every story generation request touches the Anthropic API, which costs money and latency. A `pre-tool-call` hook on `mcp__claude_ai_*` calls or on `Bash(npm run dev)` could enforce a checklist before any generate call goes out: Does a valid `.env.local` exist? Is the dev server actually running? Is the test DB clean? Running these checks manually before each session is friction that compounds; a hook removes it entirely.

A `post-tool-call` hook on every `Edit` or `Write` call that automatically runs `npm run typecheck` would also eliminate a whole category of debugging. Currently typecheck runs as Step 6 in the skill, which means type errors surface after implementation. A hook that runs it after every file write surfaces them immediately.

**A `review-story` sub-agent.** The story generation prompt in `lib/prompt.ts` has several soft rules: lesson woven into action, not stated as a closing moral; child's name used naturally; length 200–250 words; sensory language for ages 0–3. These are hard to enforce with a Zod schema because they are qualitative. A sub-agent with a single job — read a generated story and check it against those rules, returning a pass/fail with a short rationale — could run as a non-blocking quality check after every generation in tests. The sub-agent would call the Claude API with a short grading prompt; its output would be logged but not block the response. Over time that log would surface systematic prompt failures that are currently invisible.

**A `db-snapshot` skill.** Several sessions were lost to test database state drift — `beforeEach` cleanup that didn't run, migrations applied to the wrong database file, test data leaking between suites. A skill that creates a named SQLite snapshot before a test session and restores it on demand would make the "start from known good state" workflow a single command instead of a manual `rm dev.db && npx prisma db push` sequence.

**Scheduled story digest.** Now that the sharing API exists, a scheduled remote agent (via `/schedule`) could run nightly, query the database for stories created in the last 24 hours, and post a summary to a Slack channel or email. This is low-priority for v1 but demonstrates the class of automation that becomes straightforward once the API surface is stable and MCP gives the agent a real browser to authenticate with.

The common thread across all of these: the tooling built during this project (skill, MCP, task system) established a pattern. The next layer is making that pattern automatic — hooks to enforce it, sub-agents to parallelize the judgment calls within it, and scheduled agents to extend it beyond active sessions.
