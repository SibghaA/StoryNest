/**
 * Guest session helpers — PRD §4.6.
 *
 * Guests may generate exactly one story per session without creating an account.
 * We track that via a signed, HTTP-only cookie. These tests pin down the pure
 * helper shape so the API route can stay thin.
 */
import { describe, it, expect } from 'vitest'
import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_VALUE,
  buildGuestUsedCookie,
  hasGuestUsedStory,
} from '@/lib/guest-session'

describe('hasGuestUsedStory', () => {
  it('returns false when no cookie is present', () => {
    expect(hasGuestUsedStory(undefined)).toBe(false)
  })

  it('returns false when the cookie is the empty string', () => {
    expect(hasGuestUsedStory('')).toBe(false)
  })

  it('returns true for the canonical used marker', () => {
    expect(hasGuestUsedStory(GUEST_COOKIE_VALUE)).toBe(true)
  })

  it('rejects any other value — guards against stale formats', () => {
    expect(hasGuestUsedStory('yes')).toBe(false)
    expect(hasGuestUsedStory('true')).toBe(false)
    expect(hasGuestUsedStory('0')).toBe(false)
  })
})

describe('buildGuestUsedCookie', () => {
  it('uses the exported cookie name and value', () => {
    const cookie = buildGuestUsedCookie()
    expect(cookie.name).toBe(GUEST_COOKIE_NAME)
    expect(cookie.value).toBe(GUEST_COOKIE_VALUE)
  })

  it('is httpOnly, path=/ and sameSite=lax', () => {
    const cookie = buildGuestUsedCookie()
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.path).toBe('/')
    expect(cookie.sameSite).toBe('lax')
  })

  it('expires within the session — maxAge at most 24h', () => {
    const cookie = buildGuestUsedCookie()
    expect(cookie.maxAge).toBeGreaterThan(0)
    expect(cookie.maxAge).toBeLessThanOrEqual(60 * 60 * 24)
  })

  it('secure flag follows the caller (production = true, dev = false)', () => {
    expect(buildGuestUsedCookie({ secure: true }).secure).toBe(true)
    expect(buildGuestUsedCookie({ secure: false }).secure).toBe(false)
  })

  it('defaults secure to false so dev over http works', () => {
    expect(buildGuestUsedCookie().secure).toBe(false)
  })
})
