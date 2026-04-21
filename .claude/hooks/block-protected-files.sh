#!/usr/bin/env bash
# PreToolUse hook: blocks Write/Edit/MultiEdit on paths that CLAUDE.md
# requires explicit user confirmation for:
#   - prisma/migrations/**   (destructive DB changes)
#   - .env, .env.local, .env.*.local, .env.production (secrets)
#
# Claude Code passes the tool input on stdin as JSON. Exit 2 blocks
# the tool call and feeds stderr back to the assistant.
set -u

payload=$(cat)
path=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
print(data.get("tool_input", {}).get("file_path", ""))
' 2>/dev/null || true)

case "$path" in
  */prisma/migrations/*|*/.env|*/.env.local|*/.env.production|*/.env.*.local)
    echo "Blocked: $path is a protected file. CLAUDE.md requires explicit user confirmation before modifying it." >&2
    exit 2
    ;;
esac

exit 0
