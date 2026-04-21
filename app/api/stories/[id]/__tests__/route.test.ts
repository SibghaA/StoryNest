import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-stories-id.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-stories-id.db' } },
  })
  return { prisma: client }
})

import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { GET, PATCH, DELETE } from '../route'

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
  try {
    unlinkSync(TEST_DB_PATH)
  } catch {
    /* file may not exist */
  }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  })
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

let userId: string
let otherUserId: string
let profileId: string
let storyId: string

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({ data: { id: 'user-id-1', email: 'id@test.com' } })
  userId = user.id

  const other = await testPrisma.user.create({ data: { id: 'user-id-2', email: 'other@test.com' } })
  otherUserId = other.id

  const profile = await testPrisma.profile.create({
    data: { name: 'Zara', ageRange: '1-2y', avatar: {}, userId },
  })
  profileId = profile.id

  const story = await testPrisma.story.create({
    data: {
      keywords: ['sun', 'hat', 'park'],
      lesson: 'kindness',
      body: 'Zara shared her hat.',
      profileId,
    },
  })
  storyId = story.id

  vi.clearAllMocks()
  mockSession(userId)
})

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/stories/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await GET(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(401)
  })

  it('returns the story on success', async () => {
    const res = await GET(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(storyId)
    expect(body.data.lesson).toBe('kindness')
    expect(body.data.profile.name).toBe('Zara')
  })

  it('returns 404 for a non-existent story id', async () => {
    const res = await GET(new Request('http://localhost'), params('does-not-exist'))
    expect(res.status).toBe(404)
  })

  it("returns 404 when the story belongs to another user", async () => {
    mockSession(otherUserId)
    const res = await GET(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(404)
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/stories/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: true }),
    })
    const res = await PATCH(req, params(storyId))
    expect(res.status).toBe(401)
  })

  it('updates saved flag and returns the new value', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: true }),
    })
    const res = await PATCH(req, params(storyId))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.saved).toBe(true)
  })

  it('persists the saved flag in the database', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: true }),
    })
    await PATCH(req, params(storyId))
    const story = await testPrisma.story.findUnique({ where: { id: storyId } })
    expect(story!.saved).toBe(true)
  })

  it('returns 404 for a non-existent story id', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: true }),
    })
    const res = await PATCH(req, params('does-not-exist'))
    expect(res.status).toBe(404)
  })

  it("returns 404 when the story belongs to another user", async () => {
    mockSession(otherUserId)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: false }),
    })
    const res = await PATCH(req, params(storyId))
    expect(res.status).toBe(404)
  })
})

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/stories/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await DELETE(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(401)
  })

  it('deletes the story and returns its id', async () => {
    const res = await DELETE(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(storyId)
    const gone = await testPrisma.story.findUnique({ where: { id: storyId } })
    expect(gone).toBeNull()
  })

  it('returns 404 for a non-existent story id', async () => {
    const res = await DELETE(new Request('http://localhost'), params('does-not-exist'))
    expect(res.status).toBe(404)
  })

  it("returns 404 when the story belongs to another user", async () => {
    mockSession(otherUserId)
    const res = await DELETE(new Request('http://localhost'), params(storyId))
    expect(res.status).toBe(404)
  })
})
