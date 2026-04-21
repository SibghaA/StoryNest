import { describe, it, expect } from 'vitest'
import { buildStoryPrompt } from '@/lib/prompt'
import { generateStorySchema } from '@/lib/schemas'

// ── generateStorySchema ───────────────────────────────────────────────────────

describe('generateStorySchema', () => {
  it('accepts valid input with a single profileId', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing is caring',
    })
    expect(result.success).toBe(true)
  })

  it('accepts multiple profileIds', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1', 'profile-2'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(true)
  })

  it('rejects fewer than 3 keywords', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 3 keywords', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear', 'sleep', 'stars'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty keyword', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', '', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })

  it('rejects lesson longer than 120 characters', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'a'.repeat(121),
    })
    expect(result.success).toBe(false)
  })

  it('accepts lesson at exactly 120 characters', () => {
    const result = generateStorySchema.safeParse({
      profileIds: ['profile-1'],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'a'.repeat(120),
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty profileIds array', () => {
    const result = generateStorySchema.safeParse({
      profileIds: [],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
    })
    expect(result.success).toBe(false)
  })
})

// ── buildStoryPrompt ──────────────────────────────────────────────────────────

describe('buildStoryPrompt', () => {
  const base = {
    children: [{ name: 'Zara', ageRange: '1-2y' }],
    keywords: ['moon', 'bear', 'sleep'],
    lesson: 'sharing is caring',
  }

  it('includes the child name', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt).toContain('Zara')
  })

  it('includes all three keywords', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt).toContain('moon')
    expect(prompt).toContain('bear')
    expect(prompt).toContain('sleep')
  })

  it('includes the lesson', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt).toContain('sharing is caring')
  })

  it('includes a human-readable age label for 1-2y', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt).toContain('1 to 2 years old')
  })

  it('includes a human-readable age label for 0-12m', () => {
    const prompt = buildStoryPrompt({ ...base, children: [{ name: 'Zara', ageRange: '0-12m' }] })
    expect(prompt).toContain('under 1 year old')
  })

  it('includes a human-readable age label for 2-3y', () => {
    const prompt = buildStoryPrompt({ ...base, children: [{ name: 'Zara', ageRange: '2-3y' }] })
    expect(prompt).toContain('2 to 3 years old')
  })

  it('instructs Claude not to state the lesson as a closing moral', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt.toLowerCase()).toContain('moral')
  })

  it('specifies 200–250 word length', () => {
    const prompt = buildStoryPrompt(base)
    expect(prompt).toContain('200')
    expect(prompt).toContain('250')
  })

  it('strips angle-bracket injection from child name', () => {
    const prompt = buildStoryPrompt({
      ...base,
      children: [{ name: '<script>alert(1)</script>', ageRange: '1-2y' }],
    })
    expect(prompt).not.toContain('<script>')
    expect(prompt).not.toContain('</script>')
  })

  it('strips angle-bracket injection from lesson', () => {
    const prompt = buildStoryPrompt({ ...base, lesson: '<bad>evil</bad>' })
    expect(prompt).not.toContain('<bad>')
  })

  it('strips angle-bracket injection from keywords', () => {
    const prompt = buildStoryPrompt({ ...base, keywords: ['<a>', 'bear', 'sleep'] })
    expect(prompt).not.toContain('<a>')
  })

  it('includes relationship when multiple children are given', () => {
    const prompt = buildStoryPrompt({
      children: [
        { name: 'Zara', ageRange: '1-2y' },
        { name: 'Leo', ageRange: '2-3y' },
      ],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
      relationship: 'best friends',
    })
    expect(prompt).toContain('best friends')
  })

  it('omits relationship line for a single child', () => {
    const prompt = buildStoryPrompt({ ...base, relationship: 'siblings' })
    expect(prompt).not.toContain('siblings')
  })

  it('strips injection from relationship', () => {
    const prompt = buildStoryPrompt({
      children: [
        { name: 'Zara', ageRange: '1-2y' },
        { name: 'Leo', ageRange: '2-3y' },
      ],
      keywords: ['moon', 'bear', 'sleep'],
      lesson: 'sharing',
      relationship: '<evil>hack</evil>',
    })
    expect(prompt).not.toContain('<evil>')
  })
})
