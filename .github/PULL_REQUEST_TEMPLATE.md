## Summary

<!-- 2–4 sentences: what changed and why. Link the issue this closes. -->

Closes #

## C.L.E.A.R. self-review

**Clarity** — is the intent obvious from the code + commit messages?

**Logic** — does the implementation satisfy every acceptance criterion?

**Edge cases** — at least three inputs, states, or failure modes considered.

**Assumptions** — what a reviewer should double-check.

**Risk** — blast radius if this ships broken. (low / medium / high + one sentence)

## Test plan

- [ ] Unit / integration tests added or updated
- [ ] E2E test added or updated (if UI changed)
- [ ] `npm run lint && npm run typecheck && npm test` all green locally
- [ ] Manual verification on Vercel preview

## Security checklist (from docs/definition-of-done.md)

- [ ] Gitleaks pre-commit passed — no secrets in the diff
- [ ] `npm audit --omit=dev` surfaced no new High or Critical
- [ ] `security-reviewer` agent ran on the diff; verdict is APPROVE
- [ ] New DB queries scope to `session.user.id`
- [ ] User input reaching the Claude prompt passes through `sanitize()`

## AI disclosure

- **Tool:** Claude Code (model: <claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5>)
- **% AI-generated:** <~20% / ~50% / ~70% / ~90%>
- **Human review applied:** <what you read, ran, and verified>
- **Agents invoked:** <security-reviewer, none, etc. — include one-line finding>
