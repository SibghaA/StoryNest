/**
 * TDD tests for getProfileStories.
 * A saved story featuring multiple children must appear in every child's library.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-profile-stories.db'
const TEST_DB_URL  = 'file:./test-profile-stories.db'

import { vi } from 'vitest'
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-profile-stories.db' } },
  })
  return { prisma: client }
})

import { prisma as db } from '@/lib/prisma'
import { getProfileStories } from '@/lib/get-profile-stories'

beforeAll(() => {
  try { unlinkSync(TEST_DB_PATH) } catch { /* ok */ }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  })
})

afterAll(async () => { await db.$disconnect() })

let userId: string
let profileId1: string
let profileId2: string
let profileId3: string

beforeEach(async () => {
  await db.story.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()

  const user = await db.user.create({
    data: { email: 'test@lib.com', name: 'Parent' },
  })
  userId = user.id

  const p1 = await db.profile.create({ data: { name: 'Zara', ageRange: '1-2y', avatar: {}, userId } })
  const p2 = await db.profile.create({ data: { name: 'Leo',  ageRange: '2-3y', avatar: {}, userId } })
  const p3 = await db.profile.create({ data: { name: 'Mia',  ageRange: '0-12m', avatar: {}, userId } })
  profileId1 = p1.id
  profileId2 = p2.id
  profileId3 = p3.id
})

describe('getProfileStories — primary profile', () => {
  it('returns saved stories where the profile is the primary', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'courage',
              body: 'Once...', coProfileIds: [], saved: true },
    })
    const stories = await getProfileStories(profileId1)
    expect(stories).toHaveLength(1)
  })

  it('excludes unsaved stories', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'courage',
              body: 'Once...', coProfileIds: [], saved: false },
    })
    const stories = await getProfileStories(profileId1)
    expect(stories).toHaveLength(0)
  })

  it('excludes stories that belong to a different primary profile', async () => {
    await db.story.create({
      data: { profileId: profileId2, keywords: ['a','b','c'], lesson: 'courage',
              body: 'Once...', coProfileIds: [], saved: true },
    })
    const stories = await getProfileStories(profileId1)
    expect(stories).toHaveLength(0)
  })
})

describe('getProfileStories — co-profile inclusion', () => {
  it('returns a saved story where the profile appears as a co-profile', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'sharing',
              body: 'Once...', coProfileIds: [profileId2], saved: true },
    })
    const stories = await getProfileStories(profileId2)
    expect(stories).toHaveLength(1)
  })

  it('does not return the same story twice when querying the primary profile', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'sharing',
              body: 'Once...', coProfileIds: [profileId2], saved: true },
    })
    const stories = await getProfileStories(profileId1)
    expect(stories).toHaveLength(1)
  })

  it('co-profile story is excluded when it is not saved', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'sharing',
              body: 'Once...', coProfileIds: [profileId2], saved: false },
    })
    const stories = await getProfileStories(profileId2)
    expect(stories).toHaveLength(0)
  })

  it('returns stories from both primary and co-profile roles combined', async () => {
    // profileId2 is primary in one story, co-profile in another
    await db.story.create({
      data: { profileId: profileId2, keywords: ['x','y','z'], lesson: 'kindness',
              body: 'Story A', coProfileIds: [], saved: true },
    })
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'sharing',
              body: 'Story B', coProfileIds: [profileId2], saved: true },
    })
    const stories = await getProfileStories(profileId2)
    expect(stories).toHaveLength(2)
  })

  it('returns stories for a profile that is one of several co-profiles', async () => {
    await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'patience',
              body: 'Once...', coProfileIds: [profileId2, profileId3], saved: true },
    })
    const storiesP2 = await getProfileStories(profileId2)
    const storiesP3 = await getProfileStories(profileId3)
    expect(storiesP2).toHaveLength(1)
    expect(storiesP3).toHaveLength(1)
  })

  it('results are ordered newest first', async () => {
    const older = await db.story.create({
      data: { profileId: profileId1, keywords: ['a','b','c'], lesson: 'courage',
              body: 'Old', coProfileIds: [profileId2], saved: true,
              createdAt: new Date('2024-01-01') },
    })
    const newer = await db.story.create({
      data: { profileId: profileId1, keywords: ['d','e','f'], lesson: 'kindness',
              body: 'New', coProfileIds: [profileId2], saved: true,
              createdAt: new Date('2024-06-01') },
    })
    const stories = await getProfileStories(profileId2)
    expect(stories[0].id).toBe(newer.id)
    expect(stories[1].id).toBe(older.id)
  })
})
