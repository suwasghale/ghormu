import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkOrigin } from './origin'

describe('cookie-authenticated mutations', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3010'))
  afterEach(() => vi.unstubAllEnvs())
  it('rejects missing and cross-origin requests', () => {
    for (const origin of [undefined, 'https://attacker.invalid']) {
      const headers = origin ? { origin } : undefined
      expect(checkOrigin(new Request('http://localhost:3010/api/auth/login', { method: 'POST', headers }))?.status).toBe(403)
    }
  })
  it('accepts the application origin', () => {
    expect(checkOrigin(new Request('http://localhost:3010/api/auth/login', {
      method: 'POST', headers: { origin: 'http://localhost:3010' },
    }))).toBeNull()
  })
})
