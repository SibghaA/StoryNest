export const GUEST_COOKIE_NAME = 'storynest_guest_used'
export const GUEST_COOKIE_VALUE = '1'
export const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

export interface GuestUsedCookie {
  name: typeof GUEST_COOKIE_NAME
  value: typeof GUEST_COOKIE_VALUE
  httpOnly: true
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
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
    secure: opts.secure ?? false,
  }
}
