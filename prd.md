# Product Requirements Document — StoryNest

**Version:** 1.0  
**Status:** Draft  
**Last updated:** March 2026  

---

## 1. Overview

### 1.1 Product Summary

StoryNest is a web app that lets parents generate personalized, illustrated bedtime stories for babies and toddlers (ages 0–3). Parents provide three keywords and a life lesson; StoryNest produces a short, age-appropriate story (200–250 words) with custom scene illustrations featuring the child's saved avatar.

### 1.2 Problem Statement

Parents of young children want bedtime to feel meaningful and personal, but inventing original stories on demand is hard — especially at the end of a long day. Generic books don't reflect a child's world, and professional personalized books are expensive and slow. There is no fast, low-effort way to create a story that feels made for your child, tonight.

### 1.3 Solution

StoryNest removes the creative burden while keeping parents in the driver's seat. They provide the seeds (keywords, lesson, child's profile); the app does the writing and illustration. The result is a story that feels bespoke in seconds, not weeks.

### 1.4 Target Users

| Persona | Description | Primary need |
|---|---|---|
| **Maya** | First-time mom, 14-month-old | Fast, magical stories featuring her daughter's favorite things |
| **Tariq** | Dad of 3-year-old twins, daily user | Lesson-driven stories he can save and re-read; multi-child support |
| **Laila** | New parent, non-native English speaker | Low barrier to entry; simple UI that doesn't require fluent prose |

---

## 2. Goals & Success Metrics

### 2.1 Goals

- Deliver a personalized bedtime story in under 10 seconds from form submission
- Make story creation accessible to parents regardless of creative confidence or English fluency
- Build a saved story library that keeps users returning beyond the first session

### 2.2 Non-Goals (v1)

- Audio narration or text-to-speech
- Collaborative or shared story editing
- Printed book ordering
- Stories for children older than 3

### 2.3 Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Stories generated per active user per week | ≥ 3 |
| Story save rate (saves / generations) | ≥ 40% |
| Return visit rate (users active in week 2) | ≥ 35% |
| Generation-to-completion rate (form submit → full story displayed) | ≥ 90% |
| p95 story generation latency | < 10s |

---

## 3. User Stories

### Story Generation

- As a parent, I want to enter three keywords about my child's interests so the story feels personal to them.
- As a parent, I want to specify a life lesson (e.g. sharing, courage) so bedtime has intentional meaning.
- As a parent, I want the story to stream in progressively so I'm not staring at a loading spinner.
- As a parent, I want the story to be short enough to read in one bedtime sitting (≤ 250 words).

### Child Profiles & Avatars

- As a parent, I want to create a profile for each child so stories use their name and age-appropriate language.
- As a parent, I want to build a simple avatar for my child so they appear in the story illustrations.
- As a parent with multiple children, I want to switch profiles easily so each child gets their own stories.

### Story Library

- As a parent, I want to save stories I love so I can re-read them on future nights.
- As a parent, I want to browse my saved stories by child and date so I can find favorites quickly.
- As a parent, I want to delete stories I no longer want.

### Accessibility & Ease of Use

- As a non-native English speaker, I want placeholder text and examples in all input fields so I understand what's expected without needing to guess.
- As a new user, I want to generate my first story without creating an account so I can try before committing.

---

## 4. Features

### 4.1 Story Generation (P0)

**Description:** Core generation flow. Parent fills in a form with three keywords, a life lesson, and selects a child profile. On submit, a 200–250 word story is streamed back from the Claude API and displayed.

**Acceptance criteria:**
- Form accepts exactly 3 keywords (validated client and server side)
- Life lesson field has a character limit of 120 and offers 5 preset suggestions (sharing, courage, kindness, patience, honesty)
- Story streams token-by-token; a skeleton/progress indicator displays before first token arrives
- Generated story is 200–250 words, written in warm, simple, sensory language appropriate for ages 0–3
- The life lesson is woven into the story's action — never stated as a closing moral
- Child's name and age range are incorporated into the narrative

**Out of scope:** Regeneration with modifications, story editing by the parent

---

### 4.2 Scene Illustrations (P0)

**Description:** Up to 3 inline illustrations are generated per story using Nano Banana, reflecting the story's scenes and the child's avatar.

**Acceptance criteria:**
- Illustrations appear inline within the story view, not as a separate gallery
- Images load asynchronously after story text; placeholder shown while generating
- Image URLs are stored in Vercel Blob; only the URL is saved to the database (no base64)
- If image generation fails, the story is still usable with a graceful fallback placeholder

---

### 4.3 Child Profiles & Avatars (P0)

**Description:** Parents create a profile for each child with a name, age range, and a simple avatar (skin tone, hair color, hair style). The avatar is used as input to illustration generation.

**Acceptance criteria:**
- Profile fields: name (required), age range (required: `0–12m`, `1–2y`, `2–3y`), avatar (optional but encouraged)
- Avatar builder offers at minimum: 4 skin tone options, 4 hair colors, 3 hair styles
- Avatar data stored as flat JSON on the Profile record — no separate avatar table
- Up to 5 child profiles per account
- Profile switcher is accessible from the generate page without navigating away

---

### 4.4 Story Library (P1)

**Description:** A saved stories view scoped per child profile, showing story title (first sentence), date, and thumbnail of the first illustration.

**Acceptance criteria:**
- Stories can be saved immediately after generation with one tap
- Library view is filterable by child profile
- Stories display in reverse chronological order
- Each story opens a full read-back view with illustrations
- Stories can be deleted (with confirmation); deletion is permanent

---

### 4.5 Authentication (P0)

**Description:** Email/password auth via NextAuth.js, with optional Google OAuth. Guest users can generate one story before being prompted to create an account.

**Acceptance criteria:**
- Sign up, login, and logout flows are functional
- Guest generation is limited to 1 story; saving requires an account
- All `/api/stories` and `/api/profiles` routes require authentication
- `profileId` passed from the client is always verified against the authenticated user's account server-side

---

### 4.6 Guest / Try-Before-Sign-Up (P1)

**Description:** New visitors can generate one story without an account to experience the core value prop before committing to sign-up.

**Acceptance criteria:**
- Guest flow uses a temporary session; story is not persisted
- After generation, a prompt appears: "Save this story and create more — it's free"
- Guest story data is discarded after the session ends
- Guest users cannot access the library or profile builder

---

## 5. Technical Requirements

### 5.1 Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Next.js (App Router, API routes) |
| Database | SQLite (dev) → PostgreSQL (prod), via Prisma |
| AI | Anthropic Claude API — `claude-sonnet-4-5` |
| Image gen | Nano Banana |
| Storage | Vercel Blob |
| Deployment | Vercel |

### 5.2 Performance

- p95 story generation (first token): < 2s
- p95 story generation (complete): < 10s
- p95 illustration generation: < 15s (non-blocking; story text should be readable before images arrive)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1

### 5.3 Security & Privacy

- API keys (`ANTHROPIC_API_KEY`, `BLOB_STORAGE_URL`) live in `.env.local` only; never committed or logged
- All database queries are scoped to the authenticated user — no cross-user data leakage
- Prisma errors are never surfaced raw to the client
- Input (keywords, lesson) is sanitized before interpolation into the AI prompt
- Generated content is not used to train models (confirmed via Anthropic API default behavior)

### 5.4 Reliability

- If Claude API call fails, return a user-facing error with a retry CTA — do not silently fail
- If illustration generation fails, story text is still displayed with a placeholder image
- API routes return `{ data, error }` consistently; HTTP status codes used correctly

---

## 6. Data Model

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  profiles  Profile[]
  createdAt DateTime  @default(now())
}

model Profile {
  id       String  @id @default(cuid())
  name     String
  ageRange String  # "0-12m" | "1-2y" | "2-3y"
  avatar   Json    # { skinTone, hairColor, hairStyle }
  stories  Story[]
  userId   String
  user     User    @relation(fields: [userId], references: [id])
}

model Story {
  id        String   @id @default(cuid())
  keywords  String[] # exactly 3
  lesson    String
  body      String   # generated story text
  imageUrls String[] # up to 3 Vercel Blob URLs
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id])
  createdAt DateTime @default(now())
}
```

---

## 7. UX Requirements

### 7.1 Generation Flow

1. Parent selects (or creates) a child profile
2. Parent fills in 3 keyword fields and a life lesson field
3. Parent taps "Generate story"
4. Story streams in; illustrations load asynchronously below/within the text
5. Save button is available throughout and after generation

### 7.2 Copy & Accessibility

- All input fields must have descriptive placeholder text with concrete examples (e.g. keyword placeholder: "e.g. ducks, puddles, giggling")
- Life lesson presets reduce input burden for users less comfortable writing in English
- No jargon in UI copy — write at a 6th-grade reading level
- All icon-only buttons require `aria-label`
- Color contrast must meet WCAG AA minimum

### 7.3 Empty States

- Empty library: warm illustration + "You haven't saved any stories yet. Generate your first one →"
- No profiles: prompt to create a child profile before generating

---

## 8. Out of Scope (v1)

- Audio narration / text-to-speech playback
- Social sharing or public story links
- Story editing or remix after generation
- Printed book export
- Subscription billing or paid tiers
- Mobile native app (web-responsive only)
- Stories for children older than 3

---

## 9. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What is Nano Banana's rate limit and latency p95? Need to confirm illustration SLA. | Engineering | Open |
| 2 | Should the guest trial story be recoverable after sign-up (via session hand-off)? | Product | Open |
| 3 | Do we want to support story regeneration (re-roll with same inputs) in v1? | Product | Open |
| 4 | What happens to stories if a child profile is deleted — cascade delete or orphan? | Engineering | Open |
| 5 | Is a 5-profile-per-account cap the right limit, or should it be unlimited in v1? | Product | Open |

---

## 10. Milestones

| Milestone | Scope | Target |
|---|---|---|
| M0 — Foundation | Auth, child profiles, DB schema, project scaffold | Week 1–2 |
| M1 — Core loop | Story generation (text only), input form, streaming | Week 3–4 |
| M2 — Illustrations | Avatar builder, Nano Banana integration, Vercel Blob | Week 5–6 |
| M3 — Library | Save/browse/delete stories, guest trial flow | Week 7–8 |
| M4 — Polish | Empty states, error handling, accessibility audit, performance | Week 9–10 |
| M5 — Launch | Prod deploy, monitoring, soft launch | Week 11 |