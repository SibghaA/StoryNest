import { describe, it, expect } from 'vitest'
import {
  avatarSchema,
  createProfileSchema,
  updateProfileSchema,
  registerSchema,
} from '@/lib/schemas'

describe('avatarSchema', () => {
  it('accepts valid avatar', () => {
    const result = avatarSchema.safeParse({
      skinTone: 'tone-1',
      hairColor: 'black',
      hairStyle: 'straight',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid skinTone', () => {
    const result = avatarSchema.safeParse({
      skinTone: 'tone-5',
      hairColor: 'black',
      hairStyle: 'straight',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hairColor', () => {
    const result = avatarSchema.safeParse({
      skinTone: 'tone-1',
      hairColor: 'purple',
      hairStyle: 'straight',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hairStyle', () => {
    const result = avatarSchema.safeParse({
      skinTone: 'tone-1',
      hairColor: 'black',
      hairStyle: 'braided',
    })
    expect(result.success).toBe(false)
  })
})

describe('createProfileSchema', () => {
  it('accepts valid input without avatar', () => {
    const result = createProfileSchema.safeParse({ name: 'Zara', ageRange: '1-2y' })
    expect(result.success).toBe(true)
  })

  it('accepts valid input with avatar', () => {
    const result = createProfileSchema.safeParse({
      name: 'Zara',
      ageRange: '0-12m',
      avatar: { skinTone: 'tone-2', hairColor: 'brown', hairStyle: 'curly' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = createProfileSchema.safeParse({ ageRange: '1-2y' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = createProfileSchema.safeParse({ name: '', ageRange: '1-2y' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 50 chars', () => {
    const result = createProfileSchema.safeParse({
      name: 'a'.repeat(51),
      ageRange: '1-2y',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid ageRange', () => {
    const result = createProfileSchema.safeParse({ name: 'Zara', ageRange: '4-5y' })
    expect(result.success).toBe(false)
  })

  it('rejects missing ageRange', () => {
    const result = createProfileSchema.safeParse({ name: 'Zara' })
    expect(result.success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('accepts name-only update', () => {
    const result = updateProfileSchema.safeParse({ name: 'Leo' })
    expect(result.success).toBe(true)
  })

  it('accepts ageRange-only update', () => {
    const result = updateProfileSchema.safeParse({ ageRange: '2-3y' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no-op update)', () => {
    const result = updateProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid ageRange', () => {
    const result = updateProfileSchema.safeParse({ ageRange: 'invalid' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid credentials', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'secret12' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ email: 'notanemail', password: 'secret12' })
    expect(result.success).toBe(false)
  })

  it('rejects password under 8 chars', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})
