---
name: TDD commit discipline — red, green, refactor as separate commits
description: Each TDD phase is its own commit; do not squash them
type: feedback
---

Red, green, and refactor are three separate commits. Do not squash them into one.

**Why:** The git log for the sharing feature (`eaa09851` → `72f5027c` → `2fb0a5eb` → `783ae653`) made the history readable as a specification — what was promised, then the GET, then the POST, then the cleanup. This was validated in the sprint 2 retro as clearly better than the sprint 1 approach (`00ab2574` — one big commit for the generate API).

**How to apply:** Any new feature that adds logic gets three commits. The first commit must have failing tests. If backfilling coverage on existing code (not new logic), this rule does not apply — use `add-feature` v2's "coverage-gap" path instead.
