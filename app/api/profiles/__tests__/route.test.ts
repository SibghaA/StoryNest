import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test.db'
const TEST_DB_URL = `file:${TEST_DB_PATH}`

// Mock next-auth — we isolate auth to focus on DB + business logic
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Create a dedicated test PrismaClient inside the factory (factory is hoisted, so no outer refs)
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test.db' } },
  })
  return { prisma: client }
})

// These imports resolve after mocks are set up
import { getServerSession } from 'next-auth'
import { prisma as testPrisma } from '@/lib/prisma'
import { GET, POST } from '../route'
import { PATCH, DELETE } from '../[id]/route'

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
  // Remove stale test DB so we start with a clean schema each run
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
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()
})

async function createUser(id: string, email: string) {
  return testPrisma.user.create({ data: { id, email } })
}

describe('GET /api/profiles', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns empty array when user has no profiles', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('returns only profiles belonging to the authenticated user', async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    await testPrisma.profile.create({
      data: { name: 'Mine', ageRange: '1-2y', avatar: {}, userId: 'user-1' },
    })
    await testPrisma.profile.create({
      data: { name: 'Theirs', ageRange: '2-3y', avatar: {}, userId: 'user-2' },
    })

    mockSession('user-1')
    const res = await GET()
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Mine')
  })
})

describe('POST /api/profiles', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zara', ageRange: '1-2y' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a profile and returns 201', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zara', ageRange: '1-2y' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.name).toBe('Zara')
    expect(body.data.ageRange).toBe('1-2y')
  })

  it('returns 400 for missing name', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ageRange: '1-2y' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid ageRange', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zara', ageRange: 'invalid' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when user already has 5 profiles', async () => {
    await createUser('user-1', 'u1@test.com')
    mockSession('user-1')

    for (let i = 0; i < 5; i++) {
      await testPrisma.profile.create({
        data: { name: `Child ${i}`, ageRange: '1-2y', avatar: {}, userId: 'user-1' },
      })
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sixth', ageRange: '1-2y' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/limit/i)
  })
})

describe('PATCH /api/profiles/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'any-id' }) })
    expect(res.status).toBe(401)
  })

  it('updates the profile successfully', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await testPrisma.profile.create({
      data: { name: 'Original', ageRange: '1-2y', avatar: {}, userId: 'user-1' },
    })

    mockSession('user-1')
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: profile.id }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Updated')
  })

  it("returns 401 when updating another user's profile", async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile = await testPrisma.profile.create({
      data: { name: 'Theirs', ageRange: '1-2y', avatar: {}, userId: 'user-2' },
    })

    mockSession('user-1')
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hijacked' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: profile.id }) })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/profiles/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    noSession()
    const req = new Request('http://localhost', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'any-id' }) })
    expect(res.status).toBe(401)
  })

  it('deletes the profile and returns its id', async () => {
    await createUser('user-1', 'u1@test.com')
    const profile = await testPrisma.profile.create({
      data: { name: 'ToDelete', ageRange: '0-12m', avatar: {}, userId: 'user-1' },
    })

    mockSession('user-1')
    const req = new Request('http://localhost', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: profile.id }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(profile.id)

    const deleted = await testPrisma.profile.findUnique({ where: { id: profile.id } })
    expect(deleted).toBeNull()
  })

  it("returns 401 when deleting another user's profile", async () => {
    await createUser('user-1', 'u1@test.com')
    await createUser('user-2', 'u2@test.com')
    const profile = await testPrisma.profile.create({
      data: { name: 'Theirs', ageRange: '2-3y', avatar: {}, userId: 'user-2' },
    })

    mockSession('user-1')
    const req = new Request('http://localhost', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: profile.id }) })
    expect(res.status).toBe(401)
  })
})
