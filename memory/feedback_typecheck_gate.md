---
name: Custom skills must end with typecheck + test gate
description: Every add-feature session must pass tsc and vitest before closing
type: feedback
---

Every session using `add-feature` must run `npm run typecheck && npm test` before the session closes. This is enforced by the Stop hook in `.claude/settings.json` and is also Step 6 in `add-feature` v2.

**Why:** In sprint 1, a skipped typecheck let a `null` dereference bug merge to main. It passed Vitest because the test fixture was narrower than real usage. The typecheck would have caught it in seconds. This is why `add-feature` v1 was iterated to v2.

**How to apply:** Never mark a feature complete if `npm run typecheck` is red. If the Stop hook fires with errors, fix them before ending the session.
