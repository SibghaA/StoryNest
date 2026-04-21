# Definition of Done

A change is "Done" only when every box below is ticked. No exceptions for
"I'll fix it in the next PR" — that PR never gets written.

## Code

- [ ] Implements every acceptance criterion on the GitHub issue.
- [ ] No `any`. `unknown` with explicit narrowing where types can't be inferred.
- [ ] Named exports (default exports only for Next.js pages and layouts).
- [ ] No dead code, no commented-out blocks, no `console.log` left behind.
- [ ] User-supplied strings that reach the Claude prompt go through `sanitize()`.

## Tests

- [ ] Unit / integration tests for every new function, route, or schema.
- [ ] E2E test for any new UI surface (or updated E2E if existing surface changed).
- [ ] Protected routes have coverage for 401, 400, 404, 403, and happy-path.
- [ ] `npm test` and `npx playwright test` pass locally.
- [ ] Coverage ≥ 70% for the changed paths (once coverage reporting is wired).

## Lint + types

- [ ] `npm run lint` passes (ESLint + Prettier).
- [ ] `npm run typecheck` passes (strict mode, `--noEmit`).

## Security (see `docs/security.md` for full detail)

- [ ] Gitleaks pre-commit scan passed — no secrets in the diff.
- [ ] `npm audit --omit=dev` surfaced no new High or Critical findings.
- [ ] `security-reviewer` agent ran on the diff; verdict is `APPROVE`; its
      output is pasted into the PR body.
- [ ] No `.env*` file appears in the diff except `.env.example`, and
      `.env.example` contains placeholder values only.
- [ ] New DB queries are scoped to `session.user.id` — verified by the reviewer.

## CI

- [ ] Every GitHub Actions stage is green: lint, typecheck, unit, E2E,
      `npm audit`, AI PR review, preview deploy.

## PR hygiene

- [ ] PR body uses the C.L.E.A.R. template from `.claude/skills/create-pr.md`.
- [ ] AI-disclosure metadata block is filled in (tool, % AI-generated,
      human review, agents invoked).
- [ ] Branch name matches `<type>/<issue-number>-<slug>` — e.g. `feat/42-guest-flow`.
- [ ] One logical change per PR. Split drive-by cleanups into their own PR.

## Docs

- [ ] `CLAUDE.md` / `docs/*.md` / `prd.md` updated if the change alters
      architecture, conventions, or threat model.
- [ ] README or in-code comments only when a future reader couldn't derive the
      intent from the code (per the project's commenting policy).

## Deploy

- [ ] Vercel preview URL is live and has been clicked through manually.
- [ ] On merge to `main`, production deploy succeeds and the affected feature
      is sanity-checked on the production URL.
