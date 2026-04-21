# Video demo script — 8 minutes

Target runtime 7–8 minutes. Shoot at 1080p with screen recording + face cam
(optional). Record the product walkthrough and the Claude Code walkthrough
as two continuous takes if possible — saves editing.

## 0:00–0:45 — Hook + problem (45s)

> "Bedtime stories — every parent of a toddler knows the drill. You want it to
> feel personal, it's the end of a long day, you have nothing creative left.
> StoryNest is the app I built to solve that: three keywords, one life lesson,
> your kid's avatar — and fifteen seconds later, a warm, sensory 250-word story
> streams onto the page with custom watercolour illustrations."

Cut to landing page. Click "Sign in". Cut.

## 0:45–3:30 — Product walkthrough (2:45)

Record logged in as a demo user with two profiles already created.

1. **Profile switcher (15s)** — show the two child profiles, click into one.
2. **Library view (20s)** — scroll the saved stories. Point at one and say
   "this is from last night; reverse chronological; click to re-read".
3. **Avatar builder (30s)** — open the edit profile page. Click through the
   skin tone, hair colour, hair style, outfit pickers. The preview updates
   live.
4. **Generate flow (1:30)** — the centrepiece.
   - Pick the Forest Friends scenario (not Custom).
   - Choose the Kindness lesson preset.
   - Click Generate.
   - Narrate: "We're now streaming tokens from Anthropic's
     `claude-sonnet-4-5` directly into a `ReadableStream` — no buffering. The
     parent sees words appear in real time."
   - While the story finishes, say: "The illustrations are non-blocking — the
     story text is readable first. Those three images are fal.ai's
     `flux/schnell` model generating scene-by-scene."
   - Wait for the illustrations. Save the story.

## 3:30–7:30 — Claude Code walkthrough (4:00)

Switch to code editor + terminal. This is the part that differentiates the
submission from "I built an AI app".

1. **CLAUDE.md (30s)** — open it, scroll through. Point at the `@prd.md`,
   `@docs/architecture.md`, `@docs/security.md` imports. Say: "Every Claude
   Code session starts with this. No re-explaining the project. The docs
   directory is modular so different imports load in different contexts."

2. **Custom skills (40s)** — `ls .claude/skills/`. Open `add-feature.md`.
   Scroll to the "Audit" step. Say: "v1 of this skill skipped the audit and
   I rebuilt the avatar component twice by accident. v2 added this step.
   Diff between `add-feature-v1.md` and `add-feature.md` is evidence of the
   evolution." `git log .claude/skills/` to show the two commits.

3. **Hooks (40s)** — open `.claude/settings.json` and
   `.claude/hooks/block-protected-files.sh`. Demo:

   ```
   echo '{"tool_input":{"file_path":"/repo/.env.local"}}' \
     | bash .claude/hooks/block-protected-files.sh
   # Blocked: /repo/.env.local is a protected file.
   ```

   Say: "Blocks the agent from editing `.env.local` or
   `prisma/migrations/*`. Exit 2 feeds the error back to Claude. Stop hook
   runs typecheck + tests every turn."

4. **Sub-agent (30s)** — open `.claude/agents/security-reviewer.md`. Read
   the OWASP mapping aloud briefly. Say: "Invoked by the reviewer Claude
   session and by the `claude-review.yml` GitHub Action on every PR. Found
   a lost `userId` filter during the multi-child refactor — exactly the
   cross-tenant data leak A01 is supposed to catch."

5. **MCP (30s)** — open `.mcp.json`. Show `e2e/generate.spec.ts`. Say:
   "Playwright MCP lets Claude Code drive a real browser. These E2E tests
   were written by the agent operating on localhost during a session.
   Catches middleware bugs that route-handler tests can't."

6. **Writer / reviewer PR (50s)** — open one of the Sprint 2 PRs on GitHub.
   Scroll to:
   - The PR body's C.L.E.A.R. block.
   - The AI-disclosure block.
   - The `claude-review.yml` comment with the security-reviewer verdict.
     Say: "Writer session opens the PR. Cold reviewer session posts the
     C.L.E.A.R. review. Human approves after reading both."

## 7:30–8:00 — Deployment + CI (30s)

Show the deployed Vercel URL actually working. Show the green GitHub Actions
run. Say: "Lint, typecheck, unit, E2E, `npm audit`, Gitleaks, Vercel preview,
Claude PR review — all green. Ship it."

## Shot list

- [ ] Landing → login screen
- [ ] Profile switcher
- [ ] Library
- [ ] Avatar builder
- [ ] Generate flow (full take)
- [ ] CLAUDE.md scroll
- [ ] `.claude/skills/` `ls`
- [ ] `add-feature.md` scroll to audit step
- [ ] Hook demo in terminal
- [ ] `.claude/agents/security-reviewer.md` scroll
- [ ] `.mcp.json` + E2E spec
- [ ] One Sprint 2 PR: body + review comment
- [ ] Green CI run on GitHub Actions
- [ ] Deployed Vercel URL

## Delivery notes

- Talk about the _choices_, not the features. "Why split generate from
  stream" is a better line than "we have two routes".
- Pause after each section. Edit later.
- Don't narrate what the viewer can already see on screen. Narrate the
  reasoning that isn't visible.
