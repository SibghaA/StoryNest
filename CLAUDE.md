# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

> Product requirements: @prd.md
> Architecture & data flows: @docs/architecture.md
> Testing strategy: @docs/testing.md
> Security posture (threat model + OWASP top 10 mapping): @docs/security.md
> Definition of Done (what "merged" means): @docs/definition-of-done.md
> AI-disclosure template for PRs: @docs/ai-disclosure-template.md
> Auto-memory index (persistent project context): @memory/MEMORY.md

StoryNest is a web app that lets parents generate personalized, illustrated
bedtime stories for babies and toddlers (ages 0–3). Parents enter three
keywords and a life lesson; Claude generates a short, age-appropriate story
(200–250 words) with inline scene illustrations featuring the child's saved
avatar.

---

## Stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Frontend   | React, TypeScript, Tailwind CSS                                     |
| Backend    | Next.js (App Router, API routes)                                    |
| Database   | SQLite (dev) → PostgreSQL (prod), via Prisma                        |
| Auth       | NextAuth.js — email/password + Google OAuth                         |
| AI         | Anthropic Claude API (`claude-sonnet-4-5`)                          |
| Image gen  | fal.ai `flux/schnell` (stand-in for Nano Banana; up to 3 per story) |
| Storage    | Vercel Blob                                                         |
| Deployment | Vercel                                                              |

---

## Commands

```bash
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build
npm run lint       # ESLint + Prettier
npm run typecheck  # tsc --noEmit
npm test           # Vitest (unit + integration)
npm test -- path/to/file.test.ts   # single suite
npx playwright test                # E2E

npx prisma migrate dev   # apply migrations (destructive — confirm first)
npx prisma studio        # DB browser
```

---

## Conventions

### TypeScript

- Strict mode on. No `any` — use `unknown` and narrow explicitly.
- Named exports only (default exports reserved for Next.js pages / layouts).

### Components

- One component per file. Tailwind only — no inline styles, no external CSS.
- Keep client components dumb. Fetch in Server Components or route handlers,
  pass data down via props.

### API routes

- Always `const session = await getServerSession(authOptions)` first. 401 if missing.
- Validate input with a Zod schema from `lib/schemas.ts`.
- Every DB query scopes to `session.user.id` (or a relation that reaches it).
- Return `{ data, error }`. HTTP status codes: 400 / 401 / 403 / 404 / 500.
- Never forward raw Prisma errors to the client.

---

## Do's & Don'ts

- **Do** stream story generation — pipe the Claude response; never buffer it.
- **Do** scope every DB query to `session.user.id`.
- **Do** sanitize keywords and lesson text before interpolating into the prompt.
- **Do** load illustrations asynchronously and non-blocking.
- **Do** show a user-facing error + retry CTA when the Claude call fails.
- **Don't** store images as base64 — upload to Vercel Blob, save the URL.
- **Don't** call the Claude API from a client component — always via a route handler.
- **Don't** state the life lesson as a closing moral; weave it into the action.
- **Don't** silently swallow illustration errors — use a placeholder, keep the story readable.
- **Don't** modify `.env.local` or `prisma/migrations/*` without explicit user
  confirmation (enforced by `.claude/hooks/block-protected-files.sh`).

---

## Claude Code configuration in this repo

| Concern                      | Location                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| Shared settings + hooks      | `.claude/settings.json`                                        |
| Local overrides (gitignored) | `.claude/settings.local.json`                                  |
| Hooks (scripts)              | `.claude/hooks/`                                               |
| Custom skills                | `.claude/skills/add-feature.md`, `.claude/skills/create-pr.md` |
| Sub-agents                   | `.claude/agents/security-reviewer.md`                          |
| MCP servers                  | `.mcp.json` (Playwright)                                       |

See `.claude/hooks/README.md` for hook behavior and `docs/security.md` for
the security review checklist the `security-reviewer` agent applies.

---

## Permissions & sandboxing

Allowed Bash in shared settings: `npm run *`, `npx prisma *`, `git diff *`,
`git log *`, `git status`, plus read-only Playwright MCP calls.

**Never allow** `Bash(rm *)`, `Bash(curl *)`, or unrestricted `Bash(*)`.

### File system boundaries

- No access outside the project root.
- `prisma/migrations/*` and `.env*` are blocked by the PreToolUse hook —
  require explicit user confirmation to bypass.
- CLAUDE.md, `docs/*`, and `.claude/*` may be edited freely.

### API key hygiene

- `ANTHROPIC_API_KEY`, `FAL_AI_KEY`, `BLOB_STORAGE_URL`, `NEXTAUTH_SECRET`,
  and `DATABASE_URL` live in `.env.local` only.
- Never log, echo, or interpolate keys into output files. Rotate immediately
  if ever committed.
