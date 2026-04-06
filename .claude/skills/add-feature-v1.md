---
name: add-feature-v1
description: Implements the next pending StoryNest task using TDD. Reads the task, writes tests, implements the feature, runs tests, and marks the task done.
---

You are implementing a feature for the StoryNest project. Follow this workflow exactly, in order.

## Step 1 — Pick the task

Run TaskList and pick the lowest-numbered pending task that has no unresolved blockers.
Print: "Working on Task #N — <subject>"
Mark it `in_progress`.

## Step 2 — Read the full task

Run TaskGet on the chosen task ID to read its full description and acceptance criteria.

## Step 3 — Read relevant existing code

Before writing a single line, read:
- Any existing route handlers or components that are most closely related to what you're building
- The test file that most resembles the pattern you'll follow (e.g. `app/api/profiles/__tests__/route.test.ts` for API tasks, any existing component for UI tasks)
- `lib/schemas.ts` if you need to add or reuse a Zod schema

Do not guess patterns from memory — read the actual files.

## Step 4 — Write tests first (TDD)

Create or extend the test file before implementing anything.

**For API route tests** follow this exact pattern already used in the project:
- Use a dedicated test DB file (e.g. `test-<feature>.db`) — never reuse `test.db` or `test-share.db`
- Mock `next-auth` and `@/lib/auth` (as shown in existing tests); do NOT mock Prisma
- Run `npx prisma db push --skip-generate` with the test DB URL in `beforeAll`
- Clean all affected tables in `beforeEach` using `deleteMany()` in dependency order (children before parents)
- Disconnect in `afterAll`
- Import route handlers directly (not via HTTP)
- Cover: 401 unauthenticated, 400 bad input, 404 not found, 403 cross-user access, 200/201 happy path

**For UI component tests**, use Vitest + React Testing Library if applicable. Test behaviour, not implementation.

**For external API calls** (Nano Banana, etc.) use `vi.fn()` stubs — never make real network calls in tests.

Run `npm test -- path/to/your.test.ts` after writing tests. They should FAIL at this point (red phase). If they pass already, you missed something.

## Step 5 — Implement

Write the implementation to make the tests pass.

**API routes must:**
- Check auth first: `const session = await getServerSession(authOptions)` — return 401 if missing
- Validate input with Zod schema from `lib/schemas.ts` (add the schema there if it doesn't exist)
- Scope every DB query to `session.user.id` — never trust a bare `profileId`/`storyId` from the client
- Return `{ data, error }` shape on every response path
- Use correct HTTP status codes: 400 bad input, 401 unauth, 403 forbidden, 404 not found, 500 unexpected

**TypeScript rules:**
- Strict mode — no `any`. Use `unknown` and narrow explicitly.
- Named exports only; default exports only for Next.js pages/layouts.

**UI components must:**
- Use Tailwind only — no inline styles, no external CSS
- One component per file
- Stay dumb — no data fetching in client components; pass data via props
- All icon-only buttons need `aria-label`
- Placeholder text must include a concrete example (e.g. "e.g. ducks, puddles, giggling")

**Do not:**
- Call the Claude API from a client component
- Store images as base64 — use Vercel Blob URLs
- State the life lesson as a closing moral in story prompts
- Silently swallow errors — always surface a user-facing message with a retry CTA

## Step 6 — Run tests (green phase)

Run `npm test -- path/to/your.test.ts`

If tests fail, fix the implementation. Do not modify tests to make them pass unless the test itself was wrong (explain why).

## Step 7 — Run full lint + typecheck

Run: `npm run lint && npm run typecheck`

Fix any errors before proceeding. Do not use `// @ts-ignore` or `eslint-disable` unless unavoidable and documented.

## Step 8 — Mark done

Mark the task `completed` in TaskUpdate.
Print a short summary: what was built, which files were created or changed, and the test count.
