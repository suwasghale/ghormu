/**
 * Session cookie names and write options, in one place.
 *
 * The Django API returns `access` and `refresh` in the *response body*. Left
 * there, the only places to keep them are `localStorage` (readable by any
 * injected script) or memory (invisible to proxy.ts, so `/admin` could not be
 * guarded before render).
 *
 * They are therefore moved into httpOnly cookies by the route handlers in
 * `app/api/auth/`, which makes them unreadable to JavaScript and readable by
 * `proxy.ts` on every request.
 */

const prefix = process.env.AUTH_COOKIE_PREFIX ?? 'sg'
export const ACCESS_COOKIE = `${prefix}_access`
export const REFRESH_COOKIE = `${prefix}_refresh`
/** Binds a social sign-in to the browser that started it. */
export const OAUTH_STATE_COOKIE = `${prefix}_oauth_state`

/** Mirrors the backend's SIMPLE_JWT lifetimes. */
const ACCESS_MAX_AGE = 60 * 15          // 15 minutes
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
/** Long enough to sign in at the provider, short enough to be useless later. */
const OAUTH_STATE_MAX_AGE = 60 * 10      // 10 minutes

interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  path: string
  maxAge: number
}

function base(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    // Plain http in development, or the cookie is silently dropped on localhost.
    secure: process.env.NODE_ENV === 'production',
    // `lax`, not `strict`: the email-verification and password-reset links are
    // top-level navigations *from an email client*, and `strict` would withhold
    // the session on that first request.
    sameSite: 'lax',
    path: '/',
    maxAge,
  }
}

export const accessCookieOptions = () => base(ACCESS_MAX_AGE)
export const refreshCookieOptions = () => base(REFRESH_MAX_AGE)
export const oauthStateCookieOptions = () => base(OAUTH_STATE_MAX_AGE)
/** maxAge 0 expires immediately — used on logout. */
export const clearCookieOptions = () => base(0)
