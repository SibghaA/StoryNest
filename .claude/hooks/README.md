# Hooks

Shared hook configuration lives in `.claude/settings.json` (checked into the repo).
Machine-local overrides stay in `.claude/settings.local.json` (gitignored).

## Configured hooks

### PreToolUse — `block-protected-files.sh`

Runs before every `Write`, `Edit`, and `MultiEdit` tool call. Blocks the call
(exit 2) if the target path matches one of:

- `**/prisma/migrations/**` — migrations are destructive; require explicit confirmation
- `**/.env`, `**/.env.local`, `**/.env.*.local`, `**/.env.production` — secrets

CLAUDE.md documents the same rules in prose; this hook enforces them mechanically
so the agent cannot forget.

### Stop — typecheck + tests

Runs `npm run typecheck && npm test` when the assistant finishes a turn.
Failing either one surfaces the output back to the assistant, so regressions
in strict-mode types or the Vitest suite cannot slip past unnoticed.

## How to test the PreToolUse hook

```bash
echo '{"tool_input":{"file_path":"/repo/prisma/migrations/0001/migration.sql"}}' \
  | bash .claude/hooks/block-protected-files.sh ; echo "exit=$?"
# expect: blocking message on stderr, exit=2

echo '{"tool_input":{"file_path":"/repo/lib/prompt.ts"}}' \
  | bash .claude/hooks/block-protected-files.sh ; echo "exit=$?"
# expect: no output, exit=0
```
