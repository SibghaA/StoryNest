---
name: add-feature
description: Implements the next pending StoryNest task using a TDD-informed workflow. Audits existing code before writing anything, writes tests, implements, typechecks, and marks the task done.
---

You are implementing a feature for the StoryNest project. Follow this workflow exactly, in order. Do not skip steps.

---

## Step 1 — Pick the task

Run TaskList and pick the lowest-numbered pending task that has no unresolved blockers.
Print: "Working on Task #N — <subject>"
Mark it `in_progress`.

---

## Step 2 — Read the full task

Run TaskGet on the chosen task ID to read its full description and acceptance criteria.

---

## Step 3 — Audit what already exists

**Before writing a single line of code or tests**, read:
- Any files that already implement part of what the task requires (routes, components, tests)
- The most closely related test file in the project (to match patterns)
- `lib/schemas.ts` if you need to add or reuse a Zod schema

Print a short inventory:
> Already implemented: [list files/functions that partially satisfy the task]
> Still missing: [list what you need to build]

This prevents duplicating work that already exists. If the task is fully complete, mark it `completed` and stop.

---

## Step 4 — Write tests

**Rule: only write tests for logic you are about to add.** Do not write tests for code that already exists unless it genuinely has no coverage.

### For API route tests (established project pattern):
- Dedicate a new test DB file per test suite (e.g. `test-<feature>.db`) — never reuse `test.db` or `test-share.db`
- Mock `next-auth` and `@/lib/auth`; do NOT mock Prisma
- Run `npx prisma db push --skip-generate` with the test DB URL in `beforeAll`
- Clean all affected tables in `beforeEach` with `deleteMany()`, children before parents
- Disconnect `testPrisma` in `afterAll`
- Import route handlers directly — not via HTTP
- Cover: 401 unauthenticated, 400 bad input, 404 not found, 403 cross-user access, 200/201 happy path

### For logic/utility tests (node env, no DOM):
- Test exported functions (validators, prompt builders, data constants, utility helpers)
- These run in the existing `environment: 'node'` setup — no jsdom required
- When testing sanitization: confirm that injected characters (`<`, `>`) are stripped from output

### For UI component tests:
- This project has **no RTL/jsdom** setup. Do not attempt to render components in tests.
- Instead, export any testable logic (data constants, utility functions) from the component and test those.
- Name exports clearly so tests can import them (e.g. `SKIN_TONES`, `buildAvatarDescription`).

### About the red/green cycle:
- If you are writing tests for **new** logic: run tests, expect them to fail (red), then implement (green).
- If you are writing tests for **existing** logic that has no coverage: run tests — they may pass immediately. That is fine; you are adding coverage, not practicing TDD.

---

## Step 5 — Implement

Write the implementation to make new tests pass (or to satisfy the task if tests already covered it).

### API routes must:
- Check auth first: `const session = await getServerSession(authOptions)` — return 401 if missing
- Validate input with a Zod schema from `lib/schemas.ts` (add the schema there if it doesn't exist)
- Scope every DB query to `session.user.id` — never trust a bare `profileId`/`storyId` from the client
- Return `{ data, error }` on every response path
- Use correct HTTP status codes: 400 bad input, 401 unauth, 403 forbidden, 404 not found, 500 unexpected

### TypeScript rules:
- Strict mode — no `any`. Use `unknown` and narrow explicitly.
- Named exports only; default exports only for Next.js pages/layouts.
- Use `!` non-null assertions only when you can guarantee non-null; prefer type narrowing.

### UI components must:
- Use Tailwind only — no inline styles, no external CSS files
- One component per file (enforce this even if extracting from an existing inline implementation)
- Stay dumb — no data fetching in client components; receive data via props
- All icon-only buttons need `aria-label`
- All icon-only toggle buttons need `aria-pressed`
- Placeholder text must include a concrete example (e.g. "e.g. ducks, puddles, giggling")
- Life lesson presets should be rendered as clickable chips that populate the field

### Do not:
- Call the Claude API from a client component — always via an API route handler
- Store images as base64 — use Vercel Blob URLs
- State the life lesson as a closing moral in story prompts
- Silently swallow errors — show a user-facing message with a retry CTA
- Mock Prisma in integration tests
- Use `// @ts-ignore` or `eslint-disable` without explaining why

---

## Step 6 — Run tests + typecheck (green phase)

Run both:
```
npm test -- path/to/your.test.ts
npm run typecheck
```

**Both must pass before proceeding.** Do not skip typecheck — it catches `undefined`/`null` narrowing issues that Vitest won't catch.

If tests fail: fix the implementation, not the tests (unless the test itself was wrong — explain why).
If typecheck fails: narrow the types properly; do not cast with `as` unless unavoidable.

---

## Step 7 — Mark done + summarise

Mark the task `completed` in TaskUpdate.

Print a short summary:
> **Done:** [what was built]
> **Files created:** [list]
> **Files modified:** [list]
> **Tests:** [N passing]
