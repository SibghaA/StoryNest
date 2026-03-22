import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-share.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-share.db' } },
  })
  return { prisma: client }
})

import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { POST as shareStory } from '../[id]/share/route'
import { GET as getSharedStories } from '../shared/route'

const mockSession = (userId: string) => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, email: 'test@example.com' },
    expires: '',
  })
}

const noSession = () => {
  vi.mocked(getServerSession).mockResolvedValue(null)
}

beforeAll(() => {
  try { unlinkSync(TEST_DB_PATH) } catch { /* file may not exist */ }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  })
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

beforeEach(async () => {
  await testPrisma.sharedStory.deleteMany()
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()
})

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createUser(id: string, email: string) {
  return testPrisma.user.create({ data: { id, email } })
}

async function createProfile(userId: string) {
  return testPrisma.profile.create({
    data: { name: 'Luna', ageRange: '1-2y', avatar: {}, userId },
  })
}

async function createStory(profileId: string) {
  return testPrisma.story.create({
    data: {
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing is caring',
      body: 'Once upon a time...',
      profileId,
    },
  })
}

function shareRequest(recipientEmail: string) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail }),
  })
}

// ─── POST /api/stories/[id]/share ───────────────────────────────────────────

describe('POST /api/stories/[id]/share', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await shareStory(
      shareRequest('other@test.com'),
      { params: Promise.resolve({ id: 'any-id' }) },
    )
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when story does not exist', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    mockSession('user-1')

    const res = await shareStory(
      shareRequest('u2@test.com'),
      { params: Promise.resolve({ id: 'nonexistent-story-id' }) },
    )
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it("returns 403 when story belongs to another user's profile", async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    await createUser('user-3', 'u3@test.com')
    const profile2 = await createProfile('user-2')
    const story = await createStory(profile2.id)
    mockSession('user-1') // user-1 tries to share user-2's story

    const res = await shareStory(
      shareRequest('u3@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/forbidden/i)
  })

  it('returns 400 when recipientEmail is missing', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await shareStory(req, { params: Promise.resolve({ id: story.id }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 when recipientEmail is not a valid email', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    const res = await shareStory(
      shareRequest('not-an-email'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when recipient email is not registered', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    const res = await shareStory(
      shareRequest('nobody@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/recipient/i)
  })

  it('returns 400 when sender tries to share a story with themselves', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    const res = await shareStory(
      shareRequest('u1@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/yourself/i)
  })

  it('creates a SharedStory record and returns 201', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    const res = await shareStory(
      shareRequest('u2@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.storyId).toBe(story.id)
    expect(body.data.recipientId).toBe('user-2')
    expect(body.data.senderId).toBe('user-1')

    const record = await testPrisma.sharedStory.findFirst({
      where: { storyId: story.id, recipientId: 'user-2' },
    })
    expect(record).not.toBeNull()
  })

  it('returns 409 when story is already shared with the same recipient', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile = await createProfile('user-1')
    const story = await createStory(profile.id)
    mockSession('user-1')

    // First share succeeds
    await shareStory(
      shareRequest('u2@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )

    // Second share is a duplicate
    const res = await shareStory(
      shareRequest('u2@test.com'),
      { params: Promise.resolve({ id: story.id }) },
    )
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already shared/i)
  })
})

// ─── GET /api/stories/shared ─────────────────────────────────────────────────

describe('GET /api/stories/shared', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await getSharedStories()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns empty array when no stories have been shared with the user', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')

    const res = await getSharedStories()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('returns stories shared with the authenticated user', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile1 = await createProfile('user-1')
    const story = await createStory(profile1.id)

    await testPrisma.sharedStory.create({
      data: { storyId: story.id, recipientId: 'user-2', senderId: 'user-1' },
    })

    mockSession('user-2')
    const res = await getSharedStories()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].story.id).toBe(story.id)
    expect(body.data[0].sender.id).toBe('user-1')
  })

  it('does not return stories shared with other users', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    await createUser('user-3', 'u3@test.com')
    const profile1 = await createProfile('user-1')
    const story = await createStory(profile1.id)

    // shared with user-2, not user-3
    await testPrisma.sharedStory.create({
      data: { storyId: story.id, recipientId: 'user-2', senderId: 'user-1' },
    })

    mockSession('user-3')
    const res = await getSharedStories()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  it('includes story body, keywords, and sender email in the response', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile1 = await createProfile('user-1')
    const story = await createStory(profile1.id)

    await testPrisma.sharedStory.create({
      data: { storyId: story.id, recipientId: 'user-2', senderId: 'user-1' },
    })

    mockSession('user-2')
    const res = await getSharedStories()
    const body = await res.json()
    const shared = body.data[0]

    expect(shared.story.body).toBe('Once upon a time...')
    expect(shared.story.keywords).toEqual(['moon', 'bear', 'sleep'])
    expect(shared.sender.email).toBe('u1@test.com')
  })

  it('returns multiple stories shared with the user, ordered newest first', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile1 = await createProfile('user-1')
    const storyA = await createStory(profile1.id)
    const storyB = await createStory(profile1.id)

    await testPrisma.sharedStory.create({
      data: { storyId: storyA.id, recipientId: 'user-2', senderId: 'user-1' },
    })
    await testPrisma.sharedStory.create({
      data: { storyId: storyB.id, recipientId: 'user-2', senderId: 'user-1' },
    })

    mockSession('user-2')
    const res = await getSharedStories()
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    // newest share first
    const dates = body.data.map((s: { sharedAt: string }) => new Date(s.sharedAt).getTime())
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1])
  })
})
