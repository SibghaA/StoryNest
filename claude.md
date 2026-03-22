# CLAUDE.md — StoryNest

StoryNest is a web app that lets parents generate personalized, illustrated bedtime stories for babies and toddlers (ages 0–3). Parents enter three keywords and a life lesson; Claude generates a short, age-appropriate story (200–250 words) with inline scene illustrations featuring the child's saved avatar.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Next.js |
| Database | SQLite |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) for story generation |
| Image gen | Nano Banana |
| Storage | Vercel Blob |
| Deployment | Vercel |

---

## Conventions

### TypeScript
- Strict mode on. No `any` — use `unknown` and narrow explicitly.
- Zod for all API input validation. Define schemas in `lib/schemas.ts`.
- Prefer named exports. Default exports only for Next.js pages/layouts.

### Components
- One component per file. Co-locate styles if using CSS modules.
- Tailwind only — no inline style tags, no external CSS files.
- Keep components dumb where possible; fetch in Server Components or route handlers, not in client components.

### API Routes
- All routes return `{ data, error }` shaped responses.
- Use HTTP status codes correctly — 400 for bad input, 401 for unauth, 500 for unexpected.
- Never expose raw Prisma errors to the client.
---

## Do's

- **Do** stream story generation — don't make the parent stare at a blank screen for 5 seconds.
- **Do** scope all DB queries to the authenticated user's profiles. Never trust a `profileId` from the client without verifying ownership.
- **Do** validate keyword count (exactly 3) and lesson length (≤ 120 chars) on both client and server.

## Don'ts

- **Don't** store generated images as base64 in the database — use blob storage and save the URL.
- **Don't** call the Claude API from a client component — always route through an API handler.
