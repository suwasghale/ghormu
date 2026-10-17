import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const cookieJar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
  }),
}))

const loginResponse = vi.fn()
vi.mock('@/lib/auth/login-response', () => ({
  loginResponse: (...args: unknown[]) => loginResponse(...args),
}))

const { POST } = await import('./route')
const { OAUTH_STATE_COOKIE } = await import('@/lib/auth/cookies')

const ORIGIN = 'http://localhost:3010'

function callback(provider: string, body: unknown) {
  return POST(
    new Request(`${ORIGIN}/api/auth/social/${provider}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ provider }) },
  )
}

function stateCookieCleared(response: Response) {
  return (response.headers.get('set-cookie') ?? '').includes(`${OAUTH_STATE_COOKIE}=;`)
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', ORIGIN)
  cookieJar.clear()
  loginResponse.mockReset()
  loginResponse.mockResolvedValue(NextResponse.json({ success: true, data: { user: {} } }))
})

describe('social sign-in callback', () => {
  it('forwards the code when the state matches this browser', async () => {
    cookieJar.set(OAUTH_STATE_COOKIE, JSON.stringify({ provider: 'google', state: 'abc' }))

    const response = await callback('google', { code: 'the-code', state: 'abc' })

    expect(response.status).toBe(200)
    expect(loginResponse).toHaveBeenCalledWith(
      expect.any(Request),
      'social/google/callback',
      { code: 'the-code', state: 'abc' },
    )
    expect(stateCookieCleared(response)).toBe(true)
  })

  it('refuses a state this browser never received', async () => {
    cookieJar.set(OAUTH_STATE_COOKIE, JSON.stringify({ provider: 'google', state: 'abc' }))

    const response = await callback('google', { code: 'planted-code', state: 'attacker-state' })

    expect(response.status).toBe(400)
    expect(loginResponse).not.toHaveBeenCalled()
    expect(stateCookieCleared(response)).toBe(true)
  })

  it('refuses a callback with no sign-in in progress', async () => {
    const response = await callback('google', { code: 'the-code', state: 'abc' })

    expect(response.status).toBe(400)
    expect(loginResponse).not.toHaveBeenCalled()
  })

  it('refuses a state issued for a different provider', async () => {
    cookieJar.set(OAUTH_STATE_COOKIE, JSON.stringify({ provider: 'github', state: 'abc' }))

    const response = await callback('google', { code: 'the-code', state: 'abc' })

    expect(response.status).toBe(400)
    expect(loginResponse).not.toHaveBeenCalled()
  })

  it('rejects a provider name that is not a plain path segment', async () => {
    const response = await callback('..%2Fadmin', { code: 'x', state: 'y' })

    expect(response.status).toBe(404)
  })

  it('rejects cross-origin requests', async () => {
    const response = await POST(
      new Request(`${ORIGIN}/api/auth/social/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
        body: JSON.stringify({ code: 'x', state: 'y' }),
      }),
      { params: Promise.resolve({ provider: 'google' }) },
    )

    expect(response.status).toBe(403)
  })
})
