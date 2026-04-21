# Testing strategy

Two suites with very different roles. Don't mix them.

## Vitest — unit + integration (`lib/__tests__/`, `app/api/**/__tests__/`, `components/__tests__/`)

Runs in `environment: 'node'`. Fast feedback. Used for:

- **Pure-logic unit tests:** prompt builder, Zod schemas, sanitization, scene
  extractor, avatar description helpers.
- **API route integration tests** against a real SQLite fixture. Route handlers
  are imported directly (`import { POST } from '@/app/api/...'`) and called
  with a hand-built `NextRequest`. **Do not** go through HTTP.

### API-route test pattern — follow exactly

- Use a **dedicated test DB file** per suite (e.g. `prisma/test-<feature>.db`).
  Never reuse `test.db`. Suites run in parallel and will corrupt each other.
- Mock `next-auth` and `@/lib/auth`, but **do not mock Prisma**. Mocked Prisma
  tests have historically masked migration failures — real sqlite catches
  those immediately.
- In `beforeAll`, set `DATABASE_URL=file:./test-<feature>.db` and run
  `npx prisma db push --skip-generate` to materialize the schema.
- In `beforeEach`, delete from child tables first, then parents
  (`sharedStory → story → profile → user`).
- In `afterAll`, `testPrisma.$disconnect()`.
- Cover these cases on every protected route, no exceptions:
  - 401 unauthenticated
  - 400 bad input (malformed JSON + schema failure)
  - 404 resource not found
  - 403 cross-user access (profile/story belongs to a different user)
  - 200 / 201 happy path

### What not to test at this layer

- The Claude streaming response end-to-end. Test the prompt builder separately;
  trust that `anthropic.messages.stream` works.
- Illustration generation via real network calls. Stub `generateImage` with
  `vi.fn()` that returns a URL string.
- UI components that need a DOM. The project has **no RTL/jsdom setup** — if
  you need to test component logic, export the testable helper (constants,
  data shapers) from the component file and test that.

## Playwright — E2E (`e2e/`)

Runs against the live dev server. Slow, and depends on `prisma/dev.db` being
seeded. Used for:

- Auth guards (redirect-to-login for unauthenticated routes).
- Form validation and lesson-preset chip behavior on `/generate`.
- Cookie/session flow — exercised through the real NextAuth credentials form.

See `e2e/README.md` for setup. The Playwright MCP server is configured in
`.mcp.json` so Claude Code can drive a real Chromium browser during development.

## Coverage target

70% line coverage, enforced in CI once coverage reporting is wired up. Uncovered
branches should be called out in the PR body if they exist.

## TDD workflow

Project convention (enforced by `.claude/skills/add-feature.md`): write the
failing test first, commit it red, then implement to green, then refactor.
Each phase is its own commit — the git history should read red → green → refactor
for any feature that adds new logic.
