import { describe, it, expect } from 'vitest'
import { illustrationSlots } from '@/components/story-illustrations'

describe('illustrationSlots', () => {
  it('always returns exactly 3 slots', () => {
    expect(illustrationSlots([])).toHaveLength(3)
    expect(illustrationSlots(['https://cdn.example.com/1.png'])).toHaveLength(3)
    expect(illustrationSlots([
      'https://cdn.example.com/1.png',
      'https://cdn.example.com/2.png',
      'https://cdn.example.com/3.png',
    ])).toHaveLength(3)
  })

  it('returns placeholder slots when imageUrls is empty', () => {
    const slots = illustrationSlots([])
    for (const slot of slots) {
      expect(slot.type).toBe('placeholder')
    }
  })

  it('returns loaded slots for non-empty URL strings', () => {
    const slots = illustrationSlots([
      'https://cdn.example.com/1.png',
      'https://cdn.example.com/2.png',
      'https://cdn.example.com/3.png',
    ])
    for (const slot of slots) {
      expect(slot.type).toBe('loaded')
    }
  })

  it('returns the correct URL for each loaded slot', () => {
    const urls = [
      'https://cdn.example.com/a.png',
      'https://cdn.example.com/b.png',
      'https://cdn.example.com/c.png',
    ]
    const slots = illustrationSlots(urls)
    expect(slots[0].url).toBe(urls[0])
    expect(slots[1].url).toBe(urls[1])
    expect(slots[2].url).toBe(urls[2])
  })

  it('treats empty string URLs as placeholders', () => {
    const slots = illustrationSlots([
      'https://cdn.example.com/1.png',
      '',
      'https://cdn.example.com/3.png',
    ])
    expect(slots[0].type).toBe('loaded')
    expect(slots[1].type).toBe('placeholder')
    expect(slots[2].type).toBe('loaded')
  })

  it('pads with placeholders when fewer than 3 URLs are provided', () => {
    const slots = illustrationSlots(['https://cdn.example.com/only.png'])
    expect(slots[0].type).toBe('loaded')
    expect(slots[1].type).toBe('placeholder')
    expect(slots[2].type).toBe('placeholder')
  })
})
