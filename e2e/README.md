# E2E Tests — Playwright MCP

Browser automation tests powered by the **Playwright MCP server** connected to Claude Code.

## MCP Server Setup

The Playwright MCP server is configured in `~/.claude.json` (project-scoped local config):

```json
{
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@playwright/mcp"],
    "env": {}
  }
}
```

### To reproduce from scratch

```bash
# 1. Add the MCP server (run once per machine)
claude mcp add playwright -s local -- npx -y @playwright/mcp

# 2. Install the Chromium browser
npx playwright install chromium

# 3. Install the Playwright test runner
npm install --save-dev @playwright/test
```

**Verify** with `claude mcp list` — you should see:
```
playwright: npx -y @playwright/mcp - ✓ Connected
```

## What this enables

Once connected, Claude Code can control a real Chromium browser to:
- Navigate pages and assert URLs/redirects
- Fill forms and click buttons
- Read rendered text (including streamed content)
- Screenshot pages for visual debugging
- Seed test data directly into the dev DB, then exercise the UI end-to-end

## Running the tests

The dev server must already be running. Because another app sometimes occupies port 3000,
start with explicit env vars so NextAuth works correctly:

```bash
# Terminal 1 — start the dev server
NEXTAUTH_URL=http://localhost:3001 NEXTAUTH_SECRET=dev-secret npm run dev

# Terminal 2 — run all E2E tests
npx playwright test

# Run a single file
npx playwright test e2e/auth.spec.ts
```

> **Note:** If port 3000 is free, omit `NEXTAUTH_URL` — the defaults work.
> `NEXTAUTH_SECRET` is required; add it to `.env.local` to avoid passing it inline.

## Test files

| File | What it covers |
|---|---|
| `e2e/auth.spec.ts` | Auth guards, login page, bad credentials, register page |
| `e2e/generate.spec.ts` | Story generation form: login → form validation → presets → counter |

## How generate.spec.ts works

1. `beforeEach` seeds a test user + child profile directly into `prisma/dev.db`
2. Each test logs in via the UI (`loginAs`) and navigates to `/generate`
3. `afterEach` deletes the seeded data and disconnects Prisma

This approach tests the real login + session flow without mocking NextAuth.
