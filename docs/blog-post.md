# StoryNest: Shipping a Streaming Claude App with Claude Code

> Draft of the technical blog post. Target publication: Medium or dev.to. Expected
> length 1,500–2,000 words. Sections marked `[PLACEHOLDER]` need the author's
> final voice pass before publishing.

---

## TL;DR

StoryNest is a web app that generates personalized, illustrated bedtime stories
for toddlers — three keywords, a life lesson, and the child's avatar go in;
250 words of warm, sensory prose streams back. I built it in two sprints using
Claude Code as a full-stack collaborator, and the tooling around the agent
(custom skills, sub-agents, hooks, MCP servers) turned out to matter at least
as much as the model itself.

This post is about the plumbing, not the product.

## Why a streaming story app?

Bedtime stories are the canonical "I want something personal, tonight, for
fifteen minutes, and I don't care about the long tail" product. Generic books
don't reflect a specific child's world. Professional personalized books take
weeks and cost $40. ChatGPT works but the output looks like ChatGPT output —
kids don't appear in the illustrations, the life lesson gets stated as a
sermon at the end, and the whole thing takes four prompts to get right.

StoryNest's job is to make the first try the one you actually read to your kid.

Architecture is plain Next.js 15 App Router on Vercel, with Prisma +
Postgres, NextAuth for auth, and the Anthropic SDK streaming `claude-sonnet-4-5`
directly to a `ReadableStream` that the client consumes. Illustrations are
asynchronous — story text streams first, images fill in behind it via fal.ai
`flux/schnell`.

## The surprise: the model isn't the hard part

I expected to spend this project wrestling with prompt quality. I did not. The
interesting problems turned out to be:

1. **How do I keep Claude Code's output aligned with a spec that changes
   mid-project?** A CLAUDE.md that imports a PRD fixes this. Every session sees
   the same contract without me re-pasting it.
2. **How do I make the agent's mistakes cheap?** Hooks that block writes to
   `.env.local` and `prisma/migrations/*` turn one class of mistake into an
   exit-code-2, not a lost hour.
3. **How do I review agent-written code as thoroughly as my own?** A separate
   "reviewer" Claude Code session with cold context catches what the writer
   session missed, in a way that continuing the same conversation could not.
4. **How do I know if the generated story actually follows the rules?** The
   Claude prompt says "don't state the lesson as a closing moral" — prose
   instructions, not a schema. A sub-agent that reads the output and grades it
   turns the rule into a check.

Each of these is a Claude Code feature (imports, hooks, custom skills,
sub-agents). The product problem — bedtime stories — was the easier half.

## The stack, concretely

```
Next.js 15 App Router      ─ Frontend + API routes
Prisma                     ─ Schema + migrations; Postgres in prod, SQLite in dev
NextAuth.js                ─ Credentials provider; JWT sessions
Anthropic SDK              ─ claude-sonnet-4-5, streamed via ReadableStream
fal.ai flux/schnell        ─ Up to 3 illustrations per story, non-blocking
Vercel Blob                ─ Image re-hosting so URLs outlive fal.ai CDN retention
Vitest                     ─ Unit + integration tests against real SQLite fixtures
Playwright + MCP           ─ E2E tests, driven by Claude Code via Playwright MCP
```

Two things worth calling out:

**The generate flow is split across two routes.** `POST /api/stories/generate`
creates the `Story` row and returns an ID. `GET /api/stories/[id]/stream` streams
the tokens. The split feels like over-engineering on paper, but it means the
client has a stable URL to navigate to _before_ the stream starts. Parents get
a bookmarkable page immediately, even while the text is still arriving. The
naive single-POST-streams-everything approach fights the App Router's routing
model; this one works with it.

**Integration tests hit a real SQLite file, not a mocked Prisma.** Per-feature
test DB files (`prisma/test-<feature>.db`). I tried mocked Prisma first. A
migration landed broken; the tests passed because the mocks didn't know about
the schema change. Never again.

## Claude Code: the parts that earned their keep

### Custom skills

Two skills, both rubber-hit-the-road useful.

`/add-feature` — a 7-step TDD playbook. The key step isn't the test-writing,
it's the **audit**: before writing anything, read the files that already exist
and print "already implemented: X; still missing: Y". Skipping this step was
how I nearly built a second avatar component next to the one already embedded
in `ProfileForm`. With it, the session started with a clear scope instead of
a collision-in-progress.

`/create-pr` — runs the local gate (lint / typecheck / test), drafts a PR body
with a C.L.E.A.R. self-review section (Clarity, Logic, Edge cases,
Assumptions, Risk), and appends an AI-disclosure block (tool, % AI-generated,
human review applied, agents invoked). The block matters more than it looks:
it tells the reviewer what kind of review to do. "Mostly human" gets
conventional review; "mostly AI" gets additional suspicion — does every file in
the diff need to exist, are the tests meaningful, did the agent invent an API
that doesn't exist.

### Hooks

Two, one of each type the rubric asks for.

A **PreToolUse** hook on `Write|Edit|MultiEdit` that blocks any tool call whose
`file_path` matches `prisma/migrations/*` or `.env*`. Script is 20 lines of
bash; returns exit 2 on a hit, which feeds the error message back to the
agent. Saved me from an unintended migration edit about a week in.

A **Stop** hook that runs `npm run typecheck && npm test` at the end of every
turn. Catches the class of regression where the agent declares victory while
a type error sits in a file it didn't realize was affected. Slow — adds 10–15s
per turn — but the correctness beats the latency.

### Sub-agent

`security-reviewer`. Reads the diff, applies the OWASP top 10 mapped to this
codebase, returns a verdict. Found a lost `userId` filter in a `findMany`
during the multi-child PR — exactly the cross-tenant data leak the rubric's
A01 category is supposed to catch.

### MCP

Playwright MCP. Claude Code drives a real Chromium browser against the running
dev server. Unlike Vitest, this catches middleware-layer bugs (auth redirect,
session cookie) that don't exist at the route-handler layer. `.mcp.json` is
checked into the repo so any contributor gets the same setup.

### Writer / reviewer pattern

Two Claude Code sessions per PR: writer (runs `/add-feature`) and reviewer
(cold context, reads only the diff + PR body, invokes `security-reviewer`,
posts C.L.E.A.R. review comment). The cold-context constraint is the whole
trick — a reviewer session that saw the writer's reasoning inherits its blind
spots. Fresh session, fresh eyes.

## What didn't work

**Playwright specs drift fast.** The `/generate` E2E spec was written against
the original form. Then a scenario picker got added. Then a relationship
field. The spec tested placeholder text that no longer existed. CI caught it;
fixing the spec took longer than writing it originally. Lesson: E2E spec for
every new UI feature ships in the same PR, not the next one.

**ESLint 10 ambush.** Transitively installed by something in the tree, broke
`next lint` because Next 15 calls ESLint with options ESLint 10 removed. An
hour in diagnosis. Pinned to ESLint 8 as a devDep; would eventually migrate to
flat config but not mid-submission.

**Mid-project Postgres migration.** Left it for the last week. Every test
suite had SQLite-specific fixtures. Should have been the first thing in
Sprint 2, not the last.

## What I'd build next

**A `/review-story` sub-agent** that grades generated stories against the
prompt's soft rules ("lesson woven into action, not stated as moral") and
logs violations. Would surface systematic prompt failures that are currently
invisible.

**A pre-generate validation hook.** Every generation costs money and latency.
A hook that checks `.env.local` exists, dev server is up, test DB is clean
_before_ firing a generation removes a recurring source of friction.

**Guest-flow session hand-off.** PRD says guests can generate one story
without an account. Currently the story is discarded. A sign-up CTA that
captures the guest's story and attaches it to the new account would be the
highest-conversion product change I can think of.

## Closing

The agent didn't write a better app. The agent plus an opinionated CLAUDE.md
plus two skills plus two hooks plus a sub-agent plus one MCP server plus a
writer/reviewer pattern wrote a better app. Each piece of that stack is cheap
individually — an afternoon of config, at most. What's expensive is noticing
that you need them at all.

---

**Links:**

- GitHub: <https://github.com/SibghaA/StoryNest>
- Deployed: <https://storynest.vercel.app> [PLACEHOLDER — final URL]
- Video demo: <link to YouTube / Loom>
