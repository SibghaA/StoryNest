# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

StoryNest is a web app that lets parents generate personalized, illustrated bedtime stories for babies and toddlers (ages 0–3). Parents enter three keywords and a life lesson; Claude generates a short, age-appropriate story (200–250 words) with inline scene illustrations featuring the child's saved avatar.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Next.js (App Router) |
| Database | SQLite via Prisma |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) for story generation |
| Image gen | Nano Banana |
| Storage | Vercel Blob |
| Deployment | Vercel |

---

## Commands

```bash
npm run dev        # start local dev server (http://localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit

npx prisma migrate dev   # apply migrations (confirm before running — destructive)
npx prisma studio        # open DB browser
```

---

## Architecture

The app follows Next.js App Router conventions. Key data flows:

### Story generation (the core feature)
1. Client submits 3 keywords + lesson via `POST /api/stories/generate`
2. Route handler validates input with Zod, verifies the `profileId` belongs to the authenticated user
3. Calls Claude API with streaming (`stream: true`) and pipes the response back to the client using `ReadableStream`
4. After the full story text is assembled, a second call triggers Nano Banana image generation per scene
5. Each image is uploaded to Vercel Blob; the URL (not base64) is saved to the DB alongside the story

### Auth & profile scoping
- All DB queries must be scoped to `session.user.id` — never trust a bare `profileId` from the client
- Child profiles belong to a parent user; a user can have multiple profiles (one per child)

### Input validation
- Zod schemas live in `lib/schemas.ts` — shared between API routes and client-side validation
- Keyword count must be exactly 3; lesson ≤ 120 chars; enforced on both sides

### API response shape
All route handlers return `{ data, error }`. On error, never forward raw Prisma error messages.

---

## Conventions

### TypeScript
- Strict mode on. No `any` — use `unknown` and narrow explicitly.
- Prefer named exports. Default exports only for Next.js pages/layouts.

### Components
- One component per file. Tailwind only — no inline styles, no external CSS files.
- Keep components dumb; fetch in Server Components or route handlers, not in client components.

### API Routes
- Use correct HTTP status codes: 400 bad input, 401 unauth, 500 unexpected.

---

## Do's & Don'ts

- **Do** stream story generation — pipe the Claude response directly to the client.
- **Do** scope all DB queries to the authenticated user's profiles.
- **Don't** store generated images as base64 — upload to Vercel Blob and save the URL.
- **Don't** call the Claude API from a client component — always route through an API handler.

---

## Permissions & Sandboxing

Allowed Claude Code tools (defined in `.claude/settings.json`):
- `Read`, `Write`, `Edit`
- `Bash(npm run *)`, `Bash(npx prisma *)`, `Bash(git diff *)`, `Bash(git log *)`, `Bash(git status)`

**Never allow** `Bash(rm *)`, `Bash(curl *)`, or unrestricted `Bash(*)`.

### File system boundaries
- Do not access files outside the project root.
- Do not write to `prisma/migrations/` without explicit user confirmation.
- Do not modify `.env.local` directly — prompt the user to update it.

### API key hygiene
- `ANTHROPIC_API_KEY` and `BLOB_STORAGE_URL` live in `.env.local` only.
- Never log, echo, or interpolate keys into output files.
