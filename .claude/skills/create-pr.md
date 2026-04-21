---
name: create-pr
description: Opens a pull request for the current branch using the writer/reviewer pattern. Runs the local gate (typecheck, lint, tests), drafts a PR body that applies the C.L.E.A.R. review framework, and attaches the AI-disclosure metadata required by the team's Definition of Done.
---

You are opening a pull request for work already committed to the current branch. Follow this workflow exactly.

---

## Step 1 — Confirm the branch is ready to review

Run these in parallel:

- `git status` — must be clean. If there are uncommitted changes, stop and ask the user what to do with them.
- `git log main..HEAD --oneline` — the list of commits this PR will contain.
- `git diff main...HEAD --stat` — the file-level shape of the change.

Print: "PR will contain N commits touching M files." If N is 0, stop — nothing to review.

---

## Step 2 — Run the local gate

Run all four in parallel; all must pass before you open the PR:

```
npm run lint
npm run typecheck
npm test
npx playwright test    # only if the change touches the UI
```

If any fail, stop. Print which gate failed and why. Do not open a PR that won't pass CI.

---

## Step 3 — Draft the PR body using C.L.E.A.R.

Use this template verbatim. Each section must be filled in; do not leave placeholders.

```markdown
## Summary

<2–4 sentences: what changed and why>

## C.L.E.A.R. self-review

**Clarity** — is the intent of the change obvious from the code and commit messages?
<answer + evidence>

**Logic** — does the implementation correctly satisfy the acceptance criteria?
<answer + link to the issue or spec>

**Edge cases** — what inputs, states, or failure modes were considered?
<list at least three; say "none" only if genuinely not applicable>

**Assumptions** — what did you take for granted that a reviewer should double-check?
<list assumptions about data shape, auth, external APIs, feature flags, etc.>

**Risk** — blast radius if this ships broken?
<low / medium / high + 1 sentence justifying>

## Test plan

- [ ] Unit / integration tests added or updated
- [ ] E2E test added or updated (if UI changed)
- [ ] Manual steps the reviewer can run locally

## AI disclosure

- **Tool:** Claude Code (model: <claude-opus-4-7 / claude-sonnet-4-6 / etc.>)
- **% AI-generated:** <rough estimate of lines written by the agent vs. by you>
- **Human review applied:** <what you read, ran, and verified yourself>
- **Agents invoked:** <e.g. security-reviewer, none>
```

Rules for filling it in:

- The % AI-generated number is an honest estimate, not a precise metric. Typical ranges: `~90%` for agent-heavy work, `~50%` for pair-authored, `<20%` for minor agent edits on human code.
- Never write "100%" — a human reviewed it, so at minimum the review counts as human input.
- If a security-reviewer or other sub-agent was invoked on the diff, paste a one-line summary of its finding(s) under **Agents invoked**.

---

## Step 4 — Open the PR

```
gh pr create --title "<short imperative title, <70 chars>" --body "$(cat <<'EOF'
<body from Step 3>
EOF
)"
```

Do not include the `🤖 Generated with Claude Code` footer on this project — the
AI-disclosure block above replaces it and is more specific.

Return the PR URL.

---

## Step 5 — Invoke the reviewer (writer/reviewer pattern)

Leave a single comment on the PR that triggers the reviewer agent:

```
gh pr comment <url> --body "/review — reviewer should apply C.L.E.A.R. and check security-reviewer output before approving."
```

Stop here. The writer's job is done; the reviewer runs next.
