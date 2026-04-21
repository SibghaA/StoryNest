import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-generate-route.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-generate-route.db' } },
  })
  return { prisma: client }
})

import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { POST } from '../route'

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

let profileId: string

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({
    data: { id: 'user-gen-1', email: 'gen@test.com', name: 'Test Parent' },
  })
  const profile = await testPrisma.profile.create({
    data: {
      name: 'Luna',
      ageRange: '1-2y',
      avatar: { skinTone: 'tone-2', hairColor: 'black', hairStyle: 'open' },
      userId: user.id,
    },
  })
  profileId = profile.id

  vi.clearAllMocks()
  mockSession('user-gen-1')
})

function generateRequest(overrides: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/stories/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileIds: [profileId],
      keywords: ['ducks', 'rain', 'boots'],
      lesson: 'courage',
      scenario: 'Forest Friends',
      ...overrides,
    }),
  })
}

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('POST /api/stories/generate — auth', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await POST(generateRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })
})

// ── JSON response ─────────────────────────────────────────────────────────────

describe('POST /api/stories/generate — JSON response', () => {
  it('returns 201 with storyId in JSON body', async () => {
    const res = await POST(generateRequest())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.storyId).toBeTruthy()
  })

  it('Content-Type is application/json (not a stream)', async () => {
    const res = await POST(generateRequest())
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  it('storyId references a real story in the DB', async () => {
    const res = await POST(generateRequest())
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story).not.toBeNull()
  })

  it('story has correct profileId, keywords, lesson, and scenario', async () => {
    const res = await POST(generateRequest())
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story!.profileId).toBe(profileId)
    expect(story!.keywords).toEqual(['ducks', 'rain', 'boots'])
    expect(story!.lesson).toBe('courage')
    expect(story!.scenario).toBe('Forest Friends')
  })

  it('story body starts empty (body is written by the stream endpoint)', async () => {
    const res = await POST(generateRequest())
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.storyId } })
    expect(story!.body).toBe('')
  })
})

// ── Validation ────────────────────────────────────────────────────────────────

describe('POST /api/stories/generate — validation', () => {
  it('returns 400 for missing keywords', async () => {
    const res = await POST(generateRequest({ keywords: undefined }))
    expect(res.status).toBe(400)
  })

  it('returns 401 for a profileId that does not belong to the user', async () => {
    const otherUser = await testPrisma.user.create({
      data: { email: 'other@test.com', name: 'Other' },
    })
    const otherProfile = await testPrisma.profile.create({
      data: { name: 'Rival', ageRange: '2-3y', avatar: {}, userId: otherUser.id },
    })
    const res = await POST(generateRequest({ profileIds: [otherProfile.id] }))
    expect(res.status).toBe(401)
  })
})
