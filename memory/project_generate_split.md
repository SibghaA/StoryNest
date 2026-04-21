---
name: Story generation split into two routes
description: Why generate and stream are separate endpoints, not one
type: project
---

The story generation flow is split across two routes: `POST /api/stories/generate` creates the DB row and returns `{ storyId }`, then `GET /api/stories/[id]/stream` does the actual Claude streaming.

**Why:** The naive approach — streaming directly from the POST — meant the client had no stable URL to navigate to while tokens were arriving. The split gives the client a bookmarkable `storyId` before any tokens land, and lets illustrations be re-run via `saveAndIllustrate` without re-streaming the text.

**How to apply:** Do not collapse these back into one endpoint. Any new generation feature (e.g. regenerate with same inputs) should follow the same split — create first, stream separately.
