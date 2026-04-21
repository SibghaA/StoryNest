# Security posture

This doc is the threat model and the checklist. It's imported into `CLAUDE.md`
so any agent working in this repo sees it by default, and it's the reference
that `.claude/agents/security-reviewer.md` reads before reviewing a diff.

## Threat model — what an attacker would try

1. **Cross-tenant profile leakage.** Request a `storyId` or `profileId` owned
   by another user and hope the route forgets to scope by `session.user.id`.
2. **Prompt injection.** Put `</system>` / `Ignore previous instructions` into
   a keyword or lesson field and hope it reaches the Claude prompt un-sanitized.
3. **Secret exfiltration.** Get the server to include `ANTHROPIC_API_KEY`,
   `FAL_AI_KEY`, `BLOB_STORAGE_URL`, or `NEXTAUTH_SECRET` in an error message,
   log line, or response body.
4. **Rate/credit abuse.** Trigger many story generations or illustration calls
   as an unauthenticated user, or bypass the 5-profile cap.
5. **Stored-content abuse.** Persist something shaped like `<script>` in a
   keyword and hope a downstream page renders it with `dangerouslySetInnerHTML`.

## OWASP top 10 — how each category applies here

| #   | OWASP category                           | How it applies to StoryNest                                                    | Mitigations in place                                                                                                                                                          |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Broken access control                    | A stolen `storyId` or `profileId` must never reveal another family's content   | Every Prisma query filters by `session.user.id` (or a relation that reaches it). `/api/stories/[id]/stream` re-checks ownership even though `generate` already did.           |
| A02 | Cryptographic failures                   | Passwords; session secrets; API keys                                           | bcrypt with salt rounds ≥ 10 (`bcryptjs`). NextAuth sessions are JWT-signed. Secrets live in `.env.local`, never in source or logs.                                           |
| A03 | Injection                                | User input flows into the Claude prompt; Prisma is used everywhere, no raw SQL | `lib/prompt.ts::sanitize` strips `< >` and control chars before interpolation. Prisma parameterizes all queries. No `$queryRaw` / `$executeRaw` in the codebase.              |
| A04 | Insecure design                          | Client-supplied IDs must not be trusted; illustrations must not store base64   | Ownership re-verification pattern applied on every route. Image URLs only — never base64.                                                                                     |
| A05 | Security misconfiguration                | Committed secrets; permissive Next config; overly-open CORS                    | `.env*` gitignored. Pre-commit Gitleaks scan. Next default CORS / CSP settings in use; changes must be justified in PR description.                                           |
| A06 | Vulnerable & outdated components         | npm transitive deps                                                            | `npm audit` runs in CI on every PR; any High / Critical blocks merge.                                                                                                         |
| A07 | Identification & authentication failures | Credential stuffing; session fixation                                          | NextAuth.js default session cookie (`httpOnly`, `sameSite=lax`, `secure` in prod). Rate-limiting at the auth endpoint is on the roadmap.                                      |
| A08 | Software & data integrity failures       | Trusting fal.ai / Anthropic responses blindly                                  | Responses are either streamed (Anthropic) or parsed to a known URL field (fal.ai); nothing is `JSON.parse`d straight into the DB.                                             |
| A09 | Security logging & monitoring            | Leaked secrets in logs; silenced errors                                        | `console.error` must not include request bodies, tokens, or stack traces that embed secrets. Illustration failures are logged but per-scene only; the story remains readable. |
| A10 | SSRF                                     | Outbound `fetch` calls with user-derived URLs                                  | None today — the only outbound calls are to fixed Anthropic / fal.ai endpoints with prompt strings, not URLs derived from user input.                                         |

## StoryNest-specific invariants

- `session.user.id` scoping on every `prisma.*.findMany` / `findUnique` /
  `update` / `delete` on `Profile`, `Story`, `SharedStory`. No exceptions.
- `sanitize()` is the single choke point between user input and the Claude
  prompt. A new route that builds a prompt without going through
  `buildStoryPrompt` is an automatic blocker.
- Illustration URLs must be re-hosted on Vercel Blob. Storing a third-party
  CDN URL directly is an accepted-debt Concern, not a Blocker, but flag it.
- `.env.local` is never modified by the agent directly — CLAUDE.md requires
  the user to update it, and the PreToolUse hook enforces this.

## Definition-of-Done security gates

Every PR must satisfy:

1. Gitleaks pre-commit scan passes (no leaked secrets in the diff).
2. `npm audit --omit=dev` returns no High or Critical findings introduced.
3. The `security-reviewer` agent has been run on the diff and its verdict is
   `APPROVE`. Its output is pasted into the PR description.
4. All new route handlers have explicit 401 / 403 / 404 / 400 test coverage.
5. No `.env*` file appears in the diff unless the change is to `.env.example`
   and contains no real values.

See `docs/definition-of-done.md` for the full DoD; this is the security subset.

## Key hygiene

- `ANTHROPIC_API_KEY`, `FAL_AI_KEY`, `BLOB_STORAGE_URL`, `NEXTAUTH_SECRET`,
  `DATABASE_URL` live in `.env.local` for dev and Vercel project env for prod.
- They are never logged, echoed, interpolated into response bodies, or
  written to any file by the agent.
- If any key is ever committed, rotate it immediately (even if the commit is
  reverted) — it must be assumed exposed.
