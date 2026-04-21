# Writer / reviewer pattern

Every non-trivial PR on StoryNest is authored by one Claude Code session (the
writer) and reviewed by a second, independent session (the reviewer) before a
human approves it. This doc is the playbook.

## The sessions

### Writer

- Driven by `.claude/skills/add-feature.md`.
- Picks one task, runs TDD, opens the PR via `.claude/skills/create-pr.md`.
- Fills in the C.L.E.A.R. block honestly — leading questions, not finished
  answers. "I think this handles the empty-profile case but please verify"
  is fine; "all edge cases covered" is not.

### Reviewer

- Fresh Claude Code session, cold context. Does not see the writer's chat.
- Reads the PR body and the diff.
- Invokes the `security-reviewer` sub-agent on the diff.
- Posts a single review comment using the C.L.E.A.R. template below.
- Does not approve. A human gives final approval after reading the review.

The cold-context part matters. The reviewer must not have been exposed to the
writer's reasoning — otherwise it inherits the writer's blind spots. In
practice this means literally opening a new terminal / new session, not
continuing the same conversation.

## The C.L.E.A.R. review comment

Reviewer posts one comment, not one per file. Files show up as inline review
comments only for specific line-level concerns.

```markdown
## Review — <branch name>

**Verdict:** <APPROVE w/ nits | REQUEST CHANGES | BLOCK>
**security-reviewer verdict:** <APPROVE | REQUEST CHANGES | BLOCK> — <one-line summary>

### Clarity

<is the intent of the change obvious from the diff?>

### Logic

<does the implementation satisfy the acceptance criteria on the linked issue?>

### Edge cases

<what did the writer miss? at least one concrete case or "none found">

### Assumptions

<what did the writer take for granted that is worth double-checking?>

### Risk

<blast radius if this ships broken — low / medium / high + one sentence>

### AI-disclosure audit

- Writer claimed `<~X%>` AI-generated. My read of the diff says `<close / higher / lower>` because `<evidence>`.
- Human review line says "`<copy/paste>`" — is that specific enough? `<yes / no, because>`.
```

## Where this shows up in the repo

- Sprint 2 PRs for #17 (guest flow) and #18 (Blob re-hosting) use the
  pattern end-to-end. Their PR bodies are the AI-disclosure + C.L.E.A.R.
  template filled in by the writer; the first review comment on each PR is
  the reviewer's output.
- `.claude/skills/create-pr.md` is the writer's playbook.
- `.claude/agents/security-reviewer.md` is invoked by the reviewer and
  (via `claude-review.yml`) automatically on every PR.
