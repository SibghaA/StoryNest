# Architecture

StoryNest is a Next.js App Router application. This doc captures the data
flows that are not obvious from reading the code top-down.

## Story generation (core feature)

The flow is split across two routes to keep the streaming contract clean:

1. **`POST /api/stories/generate`** creates the `Story` row.
   - Zod-validates the body against `generateStorySchema` (`lib/schemas.ts`).
   - Verifies every `profileId` in the request belongs to `session.user.id`.
   - Persists the row with an empty `body` and returns `{ storyId }`.
2. **`GET /api/stories/[id]/stream`** is what the client actually watches.
   - Re-checks ownership via `profile.userId = session.user.id`.
   - Fetches co-profiles (for multi-child stories) and builds the sanitized
     prompt via `lib/prompt.ts::buildStoryPrompt`.
   - Calls `anthropic.messages.stream({ model: 'claude-sonnet-4-5' })` and
     pipes token deltas into a `ReadableStream` that the client consumes.
   - After the stream closes, kicks off `saveAndIllustrate` non-blocking:
     writes the full body to the `Story` row and fires up to 3 illustration
     calls via `lib/illustrations.ts`.

Splitting generate and stream means the client has a stable `storyId` to
navigate to before any tokens arrive, and illustrations can be regenerated
by re-running `saveAndIllustrate` without re-streaming the text.

## Story content rules (enforced in the Claude prompt)

- Length: 200–250 words.
- Tone: warm, simple, sensory language for ages 0–3.
- Life lesson must be woven into the action — never stated as a closing moral.
- Child's name and age range must be incorporated into the narrative.
- Multi-child stories must use both names throughout; the prompt threads in an
  optional relationship string (e.g. "siblings", "best friends") when given.

All of the above live in `lib/prompt.ts::buildStoryPrompt` and are covered by
`lib/__tests__/prompt.test.ts`.

## Input sanitization

Every user-supplied string (keywords, lesson, scenario, relationship, profile
name) passes through `sanitize()` in `lib/prompt.ts` before it reaches Claude.
`sanitize()` strips angle brackets and control characters. This is the single
choke point — routes that bypass it are a security regression.

## Auth & profile scoping

- NextAuth.js, credentials provider; session exposes `session.user.id`.
- Every DB query must filter by `session.user.id` (or by a relation that
  reaches it, e.g. `profile: { userId: session.user.id }`). A bare
  `profileId` or `storyId` from the client is never trusted.
- Limits: up to 5 child profiles per account; up to 5 co-profiles per story.
- Guest flow (PRD §4.6): 1 unauthenticated generation, not persisted. Not yet
  implemented.

## API response shape

All route handlers return `{ data, error }`:

| Status | When |
|---|---|
| 200 / 201 | Success |
| 400 | Bad input (Zod failure, malformed JSON) |
| 401 | No session, or `profileId` does not belong to the caller |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource does not exist |
| 500 | Unexpected failure |

Never forward raw Prisma errors to the client. Log them server-side; return a
generic message.

## Illustration pipeline

1. `extractScenes(storyText)` splits the story into up to three excerpts
   (paragraph breaks preferred, sentence-thirds fallback).
2. For each scene, `generateImage(prompt)` calls fal.ai `fal-ai/flux/schnell`
   with a watercolor-styled prompt and the avatar description.
3. Individual scene failures are swallowed and written as an empty string in
   `imageUrls` — the story must remain readable even if one image fails.
4. URLs are written back to `story.imageUrls` in a single `prisma.story.update`.

Known gap: images are stored as the fal.ai CDN URL. Per the PRD they should be
re-hosted on Vercel Blob so URL retention is not dependent on fal.ai.
