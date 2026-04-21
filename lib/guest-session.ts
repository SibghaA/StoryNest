export const GUEST_COOKIE_NAME = 'storynest_guest_used'
export const GUEST_COOKIE_VALUE = '1'
const MAX_AGE_24H = 60 * 60 * 24

export interface GuestUsedCookie {
  name: string
  value: string
  httpOnly: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
  secure: boolean
}

export function hasGuestUsedStory(cookieValue: string | undefined): boolean {
  return cookieValue === GUEST_COOKIE_VALUE
}

export function buildGuestUsedCookie(opts: { secure?: boolean } = {}): GuestUsedCookie {
  return {
    name: GUEST_COOKIE_NAME,
    value: GUEST_COOKIE_VALUE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_24H,
    secure: opts.secure ?? false,
  }
}
