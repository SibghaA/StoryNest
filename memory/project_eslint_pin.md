---
name: ESLint pinned to v8 due to Next.js incompatibility
description: ESLint 10 was pulled in transitively and broke next lint — pinned to 8
type: project
---

ESLint is pinned to v8 in `package.json`. Do not upgrade it without verifying `next lint` still passes.

**Why:** ESLint 10 was pulled in transitively during sprint 1 and broke `next lint` with removed CLI options. The error only surfaced when CI was added in sprint 2 — it worked locally because the local binary was cached. Pinning to ESLint 8 fixed it immediately.

**How to apply:** If `next lint` breaks in CI but passes locally, check whether a transitive dep has bumped ESLint above v8 before debugging anything else.
