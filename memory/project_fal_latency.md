---
name: fal.ai illustration latency is above PRD target
description: Observed p95 ~15s vs PRD target of <15s — accepted debt, not a blocker
type: project
---

fal.ai `fal-ai/flux/schnell` p95 latency in production is observed at ~15s per image, which is at the PRD target boundary (PRD §5.2 says < 15s). This is on the open questions list (PRD §9, question #1).

**Why:** fal.ai rate limits and latency were unknown at the start of the project (PRD open question #1 was never closed). Per-scene error handling is already in place — illustration failures are swallowed and an empty string is written to `imageUrls`, keeping the story readable.

**How to apply:** Do not block story delivery on illustration completion. Illustrations must remain non-blocking. If fal.ai latency becomes a consistent user complaint post-launch, investigate Vercel Blob re-hosting and request batching as mitigations.
