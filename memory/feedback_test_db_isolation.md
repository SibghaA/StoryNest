---
name: Each test suite uses a dedicated SQLite DB file
description: Never reuse test.db across suites — they run in parallel and corrupt each other
type: feedback
---

Every API route test suite must use its own DB file (e.g. `test-generate-route.db`, `test-stories-save.db`). Never point two suites at the same file.

**Why:** Suites run in parallel under Vitest. Shared state between suites caused intermittent failures during sprint 1 profile tests that took hours to diagnose. The fix (dedicated DB per suite) made failures deterministic.

**How to apply:** When writing a new API route test, pick a new DB filename. The naming pattern is `test-<feature-slug>.db`. Add it to `.gitignore` if it isn't already covered by `*.db`.
