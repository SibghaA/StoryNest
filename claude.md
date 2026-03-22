# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For full product requirements, see @prd.md

StoryNest is a web app that lets parents generate personalized, illustrated bedtime stories for babies and toddlers (ages 0–3). Parents enter three keywords and a life lesson; Claude generates a short, age-appropriate story (200–250 words) with inline scene illustrations featuring the child's saved avatar.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Next.js (App Router, API routes) |
| Database | SQLite (dev) → PostgreSQL (prod), via Prisma |
| Auth | NextAuth.js — email/password + Google OAuth |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) |
| Image gen | Nano Banana (up to 3 illustrations per story) |
| Storage | Vercel Blob |
| Deployment | Vercel |

---

## Commands

```bash
npm run dev        # start local dev server (http://localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # run all tests
npm test -- path/to/file.test.ts  # run a single test file

npx prisma migrate dev   # apply migrations (confirm before running — destructive)
npx prisma studio        # open DB browser
```

---

## Architecture

The app follows Next.js App Router conventions. Key data flows:

### Story generation (core feature)
1. Client submits 3 keywords + lesson via `POST /api/stories/generate`
2. Route handler validates input with Zod, verifies the `profileId` belongs to the authenticated user
3. Keywords and lesson are sanitized before being interpolated into the Claude prompt
4. Claude API is called with streaming; tokens are piped back to the client via `ReadableStream` — the parent sees words appear in real time
5. After the full story text arrives, up to 3 Nano Banana image generation calls are made (non-blocking — story text is readable before images load)
6. Each image is uploaded to Vercel Blob; only the URL is written to the DB

### Story content rules (enforced in the Claude prompt)
- Length: 200–250 words
- Tone: warm, simple, sensory language for ages 0–3
- Life lesson must be woven into the story's action — never stated as a closing moral
- Child's name and age range must be incorporated into the narrative

### Auth & profile scoping
- Auth is handled by NextAuth.js; session exposes `session.user.id`
- All DB queries must be scoped to `session.user.id` — never trust a bare `profileId` from the client
- Up to 5 child profiles per account
- Guest users may generate 1 story without an account; that story is not persisted and is discarded when the session ends


### Input validation
- Zod schemas live in `lib/schemas.ts` — shared between API routes and client-side validation
- Keyword count: exactly 3. Lesson: ≤ 120 chars. Enforced on both client and server.

### API response shape
All route handlers return `{ data, error }`. HTTP status codes: 400 bad input, 401 unauth, 500 unexpected. Never forward raw Prisma errors to the client.

---

## Conventions

### TypeScript
- Strict mode on. No `any` — use `unknown` and narrow explicitly.
- Prefer named exports. Default exports only for Next.js pages/layouts.

### Components
- One component per file. Tailwind only — no inline styles, no external CSS files.
- Keep components dumb; fetch in Server Components or route handlers, not in client components.

---

## Testing Strategy

- Use **Vitest** for unit and integration tests.
- Integration tests must hit a real database (SQLite in-memory or a test fixture) — do not mock Prisma. Mocked DB tests have historically masked migration failures.
- Test API route handlers directly using Next.js route handler test utilities, not via HTTP.
- Do not test streamed story output end-to-end in unit tests; test the prompt-building and validation logic separately.
- Illustration generation (Nano Banana calls) should be tested with a stub/mock since they involve external network calls.

---

## Do's & Don'ts

- **Do** stream story generation — pipe the Claude response directly to the client; never buffer the full response first.
- **Do** scope all DB queries to the authenticated user. Verify `profileId` ownership server-side on every request.
- **Do** sanitize keywords and lesson text before interpolating into the Claude prompt.
- **Do** load illustrations asynchronously and non-blocking — story text must be readable before images arrive.
- **Do** show a user-facing error with a retry CTA if the Claude API call fails — never silently fail.
- **Don't** store generated images as base64 — upload to Vercel Blob and save the URL.
- **Don't** call the Claude API from a client component — always route through an API handler.
- **Don't** state the life lesson as a closing moral in the generated story — it must be woven into the action.
- **Don't** silently swallow illustration errors — show a placeholder image and keep the story usable.

---

## Permissions & Sandboxing

Allowed Claude Code tools (defined in `.claude/settings.json`):
- `Read`, `Write`, `Edit`
- `Bash(npm run *)`, `Bash(npx prisma *)`, `Bash(git diff *)`, `Bash(git log *)`, `Bash(git status)`

**Never allow** `Bash(rm *)`, `Bash(curl *)`, or unrestricted `Bash(*)`.

### File system boundaries
- Do not access files outside the project root.
- Do not write to `prisma/migrations/` without explicit user confirmation — migrations are destructive.
- Do not modify `.env.local` directly — prompt the user to update it.

### API key hygiene
- `ANTHROPIC_API_KEY` and `BLOB_STORAGE_URL` live in `.env.local` only — never in source.
- Never log, echo, or interpolate keys into output files. Rotate immediately if ever committed.
