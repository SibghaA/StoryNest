---
name: Auth and profile scoping invariant
description: Every DB query must scope to session.user.id — no exceptions
type: project
---

Every Prisma query on `Profile`, `Story`, or `SharedStory` must filter by `session.user.id` (or a relation that reaches it). A bare `profileId` or `storyId` from the client is never trusted.

The `security-reviewer` sub-agent caught a regression in the multi-child PR where a `prisma.profile.findMany` call lost its `userId` filter during a refactor. This is the most common class of bug in this codebase.

**Why:** Cross-tenant leakage is threat #1 in `docs/security.md`. The query-scoping pattern is the only defence once a user has a valid session.

**How to apply:** Every new route that reads or writes a `Profile`, `Story`, or `SharedStory` must be checked for `userId` scoping before the PR is opened. The `security-reviewer` agent runs automatically in CI but should also be run locally on any new route.
