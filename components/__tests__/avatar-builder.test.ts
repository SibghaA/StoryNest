import { describe, it, expect } from 'vitest'
import { avatarSchema } from '@/lib/schemas'
import {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  buildAvatarDescription,
} from '@/components/avatar-builder'

// ── Data constants ────────────────────────────────────────────────────────────

describe('SKIN_TONES', () => {
  it('has exactly 4 options', () => {
    expect(SKIN_TONES).toHaveLength(4)
  })

  it('every option has value, color, and label', () => {
    for (const tone of SKIN_TONES) {
      expect(tone.value).toBeTruthy()
      expect(tone.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(tone.label).toBeTruthy()
    }
  })

  it('values match the avatarSchema skinTone enum', () => {
    const result = avatarSchema.shape.skinTone.safeParse(SKIN_TONES[0].value)
    expect(result.success).toBe(true)
  })
})

describe('HAIR_COLORS', () => {
  it('has exactly 4 options', () => {
    expect(HAIR_COLORS).toHaveLength(4)
  })

  it('every option has value, color, and label', () => {
    for (const hc of HAIR_COLORS) {
      expect(hc.value).toBeTruthy()
      expect(hc.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(hc.label).toBeTruthy()
    }
  })

  it('values match the avatarSchema hairColor enum', () => {
    const result = avatarSchema.shape.hairColor.safeParse(HAIR_COLORS[0].value)
    expect(result.success).toBe(true)
  })
})

describe('HAIR_STYLES', () => {
  it('has exactly 3 options', () => {
    expect(HAIR_STYLES).toHaveLength(3)
  })

  it('every option has value and label', () => {
    for (const hs of HAIR_STYLES) {
      expect(hs.value).toBeTruthy()
      expect(hs.label).toBeTruthy()
    }
  })

  it('values match the avatarSchema hairStyle enum', () => {
    const result = avatarSchema.shape.hairStyle.safeParse(HAIR_STYLES[0].value)
    expect(result.success).toBe(true)
  })
})

// ── buildAvatarDescription ────────────────────────────────────────────────────

describe('buildAvatarDescription', () => {
  it('returns a non-empty string for a fully specified avatar', () => {
    const desc = buildAvatarDescription({
      skinTone: 'tone-2',
      hairColor: 'brown',
      hairStyle: 'curly',
    })
    expect(typeof desc).toBe('string')
    expect(desc!.length).toBeGreaterThan(0)
  })

  it('includes human-readable labels, not raw enum values', () => {
    const desc = buildAvatarDescription({
      skinTone: 'tone-1',
      hairColor: 'blonde',
      hairStyle: 'straight',
    })
    // Should not expose internal enum keys directly
    expect(desc).not.toContain('tone-1')
    expect(desc!.toLowerCase()).toContain('light')
    expect(desc!.toLowerCase()).toContain('blonde')
    expect(desc!.toLowerCase()).toContain('straight')
  })

  it('returns undefined for an empty avatar object', () => {
    const desc = buildAvatarDescription({})
    expect(desc).toBeUndefined()
  })
})
