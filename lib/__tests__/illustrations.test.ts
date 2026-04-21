import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { unlinkSync } from 'fs'

const TEST_DB_PATH = './test-illustrations.db'

vi.mock('next-auth', () => ({ default: vi.fn(), getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client')
  const client = new PrismaClient({
    datasources: { db: { url: 'file:./test-illustrations.db' } },
  })
  return { prisma: client }
})

vi.mock('@/lib/image-gen', () => ({
  generateImage: vi.fn(),
}))

import { prisma as testPrisma } from '@/lib/prisma'
import { generateImage } from '@/lib/image-gen'
import { extractScenes, generateStoryIllustrations } from '@/lib/illustrations'

const mockGenerateImage = vi.mocked(generateImage)

// ── DB setup ──────────────────────────────────────────────────────────────────

beforeAll(() => {
  try {
    unlinkSync(TEST_DB_PATH)
  } catch {
    /* file may not exist */
  }
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
    stdio: 'pipe',
  })
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

let _profileId: string
let storyId: string

const SAMPLE_STORY = `
Zara woke up and saw the golden sun peeking through her curtains. She clapped her tiny hands with joy and bounced out of bed to find her favourite ducks waiting by the door.

Outside, big puddles shimmered after the morning rain. Zara stomped in the first puddle and giggled as the water splashed around her red boots. The ducks waddled after her, quacking happily.

At the biggest puddle of all, Zara hesitated. It looked very deep. She reached out her hand and the smallest duck took a tiny step first, showing her it was safe. Zara smiled, took a brave step in, and they splashed together until the sun was high and warm.
`.trim()

beforeEach(async () => {
  await testPrisma.story.deleteMany()
  await testPrisma.profile.deleteMany()
  await testPrisma.user.deleteMany()

  const user = await testPrisma.user.create({
    data: { email: 'test@storynest.com', name: 'Test Parent' },
  })
  const profile = await testPrisma.profile.create({
    data: {
      name: 'Zara',
      ageRange: '1-2y',
      avatar: { skinTone: 'tone-2', hairColor: 'black', hairStyle: 'open' },
      userId: user.id,
    },
  })
  _profileId = profile.id

  const story = await testPrisma.story.create({
    data: {
      keywords: ['ducks', 'puddles', 'sunshine'],
      lesson: 'courage',
      body: SAMPLE_STORY,
      imageUrls: [],
      profileId: profile.id,
    },
  })
  storyId = story.id

  vi.clearAllMocks()
})

// ── Unit tests: extractScenes ─────────────────────────────────────────────────

describe('extractScenes', () => {
  it('returns exactly 3 scene descriptions', () => {
    const scenes = extractScenes(SAMPLE_STORY)
    expect(scenes).toHaveLength(3)
  })

  it('each scene is a non-empty string', () => {
    const scenes = extractScenes(SAMPLE_STORY)
    for (const scene of scenes) {
      expect(typeof scene).toBe('string')
      expect(scene.trim().length).toBeGreaterThan(0)
    }
  })

  it('returns 3 scenes even for a single-paragraph story', () => {
    const flat = 'Zara found a duck. The duck was yellow. They played all day. Then they slept.'
    const scenes = extractScenes(flat)
    expect(scenes).toHaveLength(3)
  })
})

// ── Integration tests: generateStoryIllustrations ────────────────────────────

describe('generateStoryIllustrations', () => {
  it('calls generateImage exactly 3 times — once per scene', async () => {
    mockGenerateImage.mockResolvedValue('https://cdn.example.com/img.png')

    await generateStoryIllustrations(storyId, SAMPLE_STORY, 'toddler girl with black hair')

    expect(mockGenerateImage).toHaveBeenCalledTimes(3)
  })

  it('saves 3 image URLs to the story record in the DB', async () => {
    mockGenerateImage
      .mockResolvedValueOnce('https://cdn.example.com/1.png')
      .mockResolvedValueOnce('https://cdn.example.com/2.png')
      .mockResolvedValueOnce('https://cdn.example.com/3.png')

    await generateStoryIllustrations(storyId, SAMPLE_STORY, 'toddler girl with black hair')

    const updated = await testPrisma.story.findUniqueOrThrow({ where: { id: storyId } })
    const urls = updated.imageUrls as string[]
    expect(urls).toHaveLength(3)
    expect(urls).toContain('https://cdn.example.com/1.png')
    expect(urls).toContain('https://cdn.example.com/2.png')
    expect(urls).toContain('https://cdn.example.com/3.png')
  })

  it('saves successful URLs even when one scene generation fails', async () => {
    mockGenerateImage
      .mockResolvedValueOnce('https://cdn.example.com/1.png')
      .mockRejectedValueOnce(new Error('Image API timeout'))
      .mockResolvedValueOnce('https://cdn.example.com/3.png')

    await generateStoryIllustrations(storyId, SAMPLE_STORY, 'toddler girl with black hair')

    const updated = await testPrisma.story.findUniqueOrThrow({ where: { id: storyId } })
    const urls = updated.imageUrls as string[]
    expect(urls).toHaveLength(3)
    expect(urls.filter(u => u !== '')).toHaveLength(2)
  })

  it('each generateImage call receives the avatar description in its prompt', async () => {
    mockGenerateImage.mockResolvedValue('https://cdn.example.com/img.png')
    const avatarDesc = 'toddler girl with curly red hair wearing a blue dress'

    await generateStoryIllustrations(storyId, SAMPLE_STORY, avatarDesc)

    for (const call of mockGenerateImage.mock.calls) {
      expect(call[0]).toContain(avatarDesc)
    }
  })
})
