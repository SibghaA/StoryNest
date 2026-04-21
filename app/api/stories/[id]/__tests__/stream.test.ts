/**
 * TDD tests for the story stream endpoint.
 * These must fail before implementation and pass after.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-stream.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({ default: vi.fn(), getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-stream.db' } },
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

import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { GET } from '../stream/route'

const mockSession = (userId: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, email: 'test@example.com' },
    expires: '',
  })

const noSession = () => vi.mocked(getServerSession).mockResolvedValue(null)

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  try { unlinkSync(TEST_DB_PATH) } catch { /* ok */ }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  })
})

afterAll(async () => { await testPrisma.$disconnect() })

let profileId: string
let storyId: string

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({
    data: { id: 'user-stream-1', email: 'stream@test.com', name: 'Parent' },
  })
  const profile = await testPrisma.profile.create({
    data: { name: 'Zara', ageRange: '1-2y', avatar: {}, userId: user.id },
  })
  profileId = profile.id

  const story = await testPrisma.story.create({
    data: {
      keywords: ['ducks', 'rain', 'boots'],
      lesson: 'courage',
      body: '',
      imageUrls: [],
      coProfileIds: [],
      scenario: 'Forest Friends',
      profileId: profile.id,
    },
  })
  storyId = story.id

  vi.clearAllMocks()
  mockSession('user-stream-1')
})

function streamRequest(id: string) {
  return new Request(`http://localhost/api/stories/${id}/stream`)
}

// ── Auth & ownership ──────────────────────────────────────────────────────────

describe('GET /api/stories/[id]/stream — auth & ownership', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await GET(streamRequest(storyId), { params: Promise.resolve({ id: storyId }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 for a non-existent story ID', async () => {
    const res = await GET(
      streamRequest('nonexistent-id'),
      { params: Promise.resolve({ id: 'nonexistent-id' }) },
    )
    expect(res.status).toBe(404)
  })

  it("returns 404 when story belongs to another user's profile", async () => {
    const otherUser = await testPrisma.user.create({
      data: { email: 'other@test.com', name: 'Other' },
    })
    const otherProfile = await testPrisma.profile.create({
      data: { name: 'Other Child', ageRange: '1-2y', avatar: {}, userId: otherUser.id },
    })
    const otherStory = await testPrisma.story.create({
      data: {
        keywords: ['a', 'b', 'c'],
        lesson: 'kindness',
        body: '',
        imageUrls: [],
        coProfileIds: [],
        profileId: otherProfile.id,
      },
    })

    const res = await GET(
      streamRequest(otherStory.id),
      { params: Promise.resolve({ id: otherStory.id }) },
    )
    expect(res.status).toBe(404)
  })
})

// ── Streaming behaviour ───────────────────────────────────────────────────────

describe('GET /api/stories/[id]/stream — streaming', () => {
  it('returns 200 with a readable text stream', async () => {
    const res = await GET(streamRequest(storyId), { params: Promise.resolve({ id: storyId }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
    expect(res.body).not.toBeNull()
  })

  it('streams the generated story text', async () => {
    const res = await GET(streamRequest(storyId), { params: Promise.resolve({ id: storyId }) })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
    expect(text).toContain('Once upon')
  })

  it('saves the story body to the DB after the stream completes', async () => {
    const res = await GET(streamRequest(storyId), { params: Promise.resolve({ id: storyId }) })
    const reader = res.body!.getReader()
    while (true) {
      const { done } = await reader.read()
      if (done) break
    }
    await new Promise(r => setTimeout(r, 50))

    const updated = await testPrisma.story.findUnique({ where: { id: storyId } })
    expect(updated!.body).toContain('Once upon')
  })
})

// ── Generate endpoint returns JSON ────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stories/generate/route'

describe('POST /api/stories/generate — returns JSON storyId (no streaming)', () => {
  it('returns 201 with { data: { storyId } } JSON body', async () => {
    const req = new NextRequest('http://localhost/api/stories/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileIds: [profileId],
        keywords: ['ducks', 'rain', 'boots'],
        lesson: 'courage',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.data.storyId).toBeTruthy()
    expect(typeof body.data.storyId).toBe('string')
  })

  it('persists the story to DB and returns its ID', async () => {
    const req = new NextRequest('http://localhost/api/stories/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileIds: [profileId],
        keywords: ['cats', 'sun', 'nap'],
        lesson: 'kindness',
        scenario: 'Cozy Nest',
      }),
    })
    const res = await POST(req)
    const { data } = await res.json()

    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story).not.toBeNull()
    expect(story!.lesson).toBe('kindness')
    expect(story!.profileId).toBe(profileId)
  })

  it('is not a streaming response — Content-Type is application/json', async () => {
    const req = new NextRequest('http://localhost/api/stories/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileIds: [profileId],
        keywords: ['ducks', 'rain', 'boots'],
        lesson: 'courage',
      }),
    })
    const res = await POST(req)
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })
})
