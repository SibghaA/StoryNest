/**
 * TDD tests for the multi-child story feature.
 * These must fail before implementation and pass after.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

// ── Schema tests (no DB needed) ───────────────────────────────────────────────

import { generateStorySchema } from '@/lib/schemas'
import { buildStoryPrompt } from '@/lib/prompt'

describe('generateStorySchema — relationship field', () => {
  const base = {
    profileIds: ['profile-1', 'profile-2'],
    keywords: ['moon', 'bear', 'sleep'],
    lesson: 'sharing',
  }

  it('accepts a valid relationship value', () => {
    const result = generateStorySchema.safeParse({ ...base, relationship: 'siblings' })
    expect(result.success).toBe(true)
  })

  it('accepts input without a relationship (optional field)', () => {
    const result = generateStorySchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('rejects relationship longer than 50 characters', () => {
    const result = generateStorySchema.safeParse({ ...base, relationship: 'a'.repeat(51) })
    expect(result.success).toBe(false)
  })
})

describe('generateStorySchema — multi-child', () => {
  it('accepts profileIds as an array with one entry', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(true)
  })

  it('accepts profileIds as an array with multiple entries', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1', 'profile-2'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty profileIds array', () => {
    const result = generateStorySchema.safeParse({
      profileIds: [],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })

  it('rejects profileIds with more than 5 entries', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })
})

describe('buildStoryPrompt — multi-child', () => {
  it('includes all children names when given multiple children', () => {
    const prompt = buildStoryPrompt({
      children: [
        { name: 'Zara', ageRange: '1-2y' },
        { name: 'Leo', ageRange: '2-3y' },
      ],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(prompt).toContain('Zara')
    expect(prompt).toContain('Leo')
  })

  it('includes correct age labels for all children', () => {
    const prompt = buildStoryPrompt({
      children: [
        { name: 'Zara', ageRange: '0-12m' },
        { name: 'Leo', ageRange: '2-3y' },
      ],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'courage',
    })
    expect(prompt).toContain('under 1 year old')
    expect(prompt).toContain('2 to 3 years old')
  })

  it('still works correctly with a single child', () => {
    const prompt = buildStoryPrompt({
      children: [{ name: 'Mia', ageRange: '1-2y' }],
      keywords: ['sun', 'cat', 'rain'],
      lesson: 'kindness',
    })
    expect(prompt).toContain('Mia')
    expect(prompt).toContain('1 to 2 years old')
  })

  it('sanitizes injected angle brackets in all child names', () => {
    const prompt = buildStoryPrompt({
      children: [
        { name: '<script>bad</script>', ageRange: '1-2y' },
        { name: 'Zara', ageRange: '1-2y' },
      ],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'honesty',
    })
    expect(prompt).not.toContain('<script>')
    expect(prompt).toContain('Zara')
  })
})

// ── Integration tests: co-profile storage ─────────────────────────────────────

const TEST_DB_PATH = './test-multi-child.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({ default: vi.fn(), getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-multi-child.db' } },
  })
  return { prisma: client }
})

vi.mock('@anthropic-ai/sdk', () => {
  const fakeChunks = [
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Once upon ' } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'a time.' } },
  ]
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        stream: vi.fn().mockReturnValue({
          async *[Symbol.asyncIterator]() {
            for (const chunk of fakeChunks) yield chunk
          },
        }),
      },
    })),
  }
})

vi.mock('@/lib/illustrations', () => ({
  generateStoryIllustrations: vi.fn().mockResolvedValue([]),
  extractScenes: vi.fn(),
}))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { POST } from '@/app/api/stories/generate/route'

const mockSession = (userId: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, email: 'test@example.com' },
    expires: '',
  })

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  try { unlinkSync(TEST_DB_PATH) } catch { /* ok */ }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  })
})

afterAll(async () => { await testPrisma.$disconnect() })

let profileId1: string
let profileId2: string

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({
    data: { id: 'user-multi-1', email: 'multi@test.com', name: 'Parent' },
  })
  const p1 = await testPrisma.profile.create({
    data: { name: 'Zara', ageRange: '1-2y', avatar: {}, userId: user.id },
  })
  const p2 = await testPrisma.profile.create({
    data: { name: 'Leo', ageRange: '2-3y', avatar: {}, userId: user.id },
  })
  profileId1 = p1.id
  profileId2 = p2.id

  vi.clearAllMocks()
  mockSession('user-multi-1')
})

function multiRequest(profileIds: string[]) {
  return new NextRequest('http://localhost/api/stories/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileIds,
      keywords: ['ducks', 'rain', 'boots'],
      lesson: 'courage',
    }),
  })
}

describe('POST /api/stories/generate — multiple children', () => {
  it('accepts profileIds array and returns 201 with storyId', async () => {
    const res = await POST(multiRequest([profileId1, profileId2]))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.storyId).toBeTruthy()
  })

  it('saves coProfileIds for additional profiles in the story record', async () => {
    const res = await POST(multiRequest([profileId1, profileId2]))
    const { data } = await res.json()
    const storyId = data.storyId

    const story = await testPrisma.story.findUnique({ where: { id: storyId } })
    const coProfileIds = story!.coProfileIds as string[]
    expect(coProfileIds).toContain(profileId2)
  })

  it('primary profileId is the first entry in the profileIds array', async () => {
    const res = await POST(multiRequest([profileId1, profileId2]))
    const { data } = await res.json()
    const storyId = data.storyId

    const story = await testPrisma.story.findUnique({ where: { id: storyId } })
    expect(story!.profileId).toBe(profileId1)
  })

  it('returns 401 when a profileId does not belong to the authenticated user', async () => {
    const otherUser = await testPrisma.user.create({
      data: { email: 'other@test.com', name: 'Other' },
    })
    const otherProfile = await testPrisma.profile.create({
      data: { name: 'Rival', ageRange: '2-3y', avatar: {}, userId: otherUser.id },
    })

    const res = await POST(multiRequest([profileId1, otherProfile.id]))
    expect(res.status).toBe(401)
  })

  it('stores relationship in the story record when provided', async () => {
    const req = new NextRequest('http://localhost/api/stories/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileIds: [profileId1, profileId2],
        keywords: ['ducks', 'rain', 'boots'],
        lesson: 'courage',
        relationship: 'best friends',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story!.relationship).toBe('best friends')
  })

  it('stores null for relationship when not provided', async () => {
    const res = await POST(multiRequest([profileId1, profileId2]))
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story!.relationship).toBeNull()
  })
})
