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

## Permissions & Sandboxing

### Claude Code allowed tools
When running Claude Code on this project, restrict to the minimum needed:
```yaml
# .claude/settings.json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Bash(npm run *)",
    "Bash(npx prisma *)",
    "Bash(git diff *)",
    "Bash(git log *)",
    "Bash(git status)"
  ]
}
```

**Never allow** `Bash(rm *)`, `Bash(curl *)`, or unrestricted `Bash(*)` — Claude should not be able to delete files or make arbitrary network calls outside the app's own API routes.

### Network allowlist
Claude Code should only reach:
- `api.anthropic.com` — story generation
- `nanbanana.com` (or whatever Nano Banana's API host is) — image generation
- Vercel Blob storage endpoint — illustration uploads
- `registry.npmjs.org` — package installs only

Flag any request to an unlisted host before proceeding.

### File system boundaries
Claude Code may read and write inside the project root. It must not:
- Access `~/.env`, `~/.ssh`, or any file outside the repo
- Write to `prisma/migrations/` without explicit user confirmation — migrations are destructive and should be reviewed
- Modify `.env.local` directly; prompt the user to update it instead

### API key hygiene
- `ANTHROPIC_API_KEY` and `BLOB_STORAGE_URL` live in `.env.local` only — never in source
- If Claude Code needs to test an API call, it uses the existing key from the environment; it must never log, echo, or interpolate keys into output files
- Rotate keys if any are ever committed, even briefly
