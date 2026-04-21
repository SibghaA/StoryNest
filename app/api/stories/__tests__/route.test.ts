import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-stories-save.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-stories-save.db' } },
  })
  return { prisma: client }
})

import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
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
let profileId: string

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({
    data: { id: 'user-save-1', email: 'save@test.com' },
  })
  userId = user.id

  const profile = await testPrisma.profile.create({
    data: { name: 'Zara', ageRange: '1-2y', avatar: {}, userId },
  })
  profileId = profile.id

  vi.clearAllMocks()
  mockSession(userId)
})

function saveRequest(overrides: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId,
      keywords: ['ducks', 'rain', 'boots'],
      lesson: 'courage',
      body: 'Once upon a time Zara put on her boots.',
      ...overrides,
    }),
  })
}

describe('POST /api/stories', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await POST(saveRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 201 and the saved story on success', async () => {
    const res = await POST(saveRequest())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.profileId).toBe(profileId)
    expect(body.data.keywords).toEqual(['ducks', 'rain', 'boots'])
    expect(body.data.lesson).toBe('courage')
    expect(body.data.body).toBe('Once upon a time Zara put on her boots.')
  })

  it('persists the story in the database', async () => {
    const res = await POST(saveRequest())
    const { data } = await res.json()
    const story = await testPrisma.story.findUnique({ where: { id: data.id } })
    expect(story).not.toBeNull()
    expect(story!.lesson).toBe('courage')
  })

  it('returns 400 when keywords array has wrong length', async () => {
    const res = await POST(saveRequest({ keywords: ['only-one'] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is missing', async () => {
    const res = await POST(saveRequest({ body: undefined }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when lesson is missing', async () => {
    const res = await POST(saveRequest({ lesson: undefined }))
    expect(res.status).toBe(400)
  })

  it('returns 401 when profileId belongs to a different user', async () => {
    const other = await testPrisma.user.create({ data: { email: 'other@test.com' } })
    const otherProfile = await testPrisma.profile.create({
      data: { name: 'Rival', ageRange: '2-3y', avatar: {}, userId: other.id },
    })
    const res = await POST(saveRequest({ profileId: otherProfile.id }))
    expect(res.status).toBe(401)
  })
})
