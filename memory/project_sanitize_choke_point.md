---
name: sanitize() is the single choke point for user input into Claude prompts
description: All user-supplied strings must go through sanitize() in lib/prompt.ts before reaching Claude
type: project
---

`sanitize()` in `lib/prompt.ts` strips angle brackets and control characters from every user-supplied string (keywords, lesson, scenario, relationship, profile name) before it reaches the Claude prompt. It is the only place this stripping happens.

**Why:** Prompt injection is threat #2 in `docs/security.md`. A new route that builds a prompt without calling `buildStoryPrompt` (which calls `sanitize()` internally) is an automatic security regression and will be flagged as a Blocker by the `security-reviewer` agent.

**How to apply:** Any new route that constructs a Claude prompt must use `buildStoryPrompt` from `lib/prompt.ts`. Do not call `anthropic.messages.create` or `.stream` with raw user input.
