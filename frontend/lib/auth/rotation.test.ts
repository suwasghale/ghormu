import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/api/server-config', () => ({ API_BASE: 'https://api.test' }))
const fetcher = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api/transport', () => ({ backendFetch: fetcher }))
beforeEach(() => { vi.resetModules(); fetcher.mockReset() })
describe('refresh exchange', () => {
  it('coalesces concurrent requests from different tabs', async () => {
    fetcher.mockResolvedValue(Response.json({ data: { access: 'new', refresh: 'next' } }))
    const { rotate } = await import('./rotation')
    const results = await Promise.all([rotate('old'), rotate('old'), rotate('old')])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results.every(r => r.status === 'ok')).toBe(true)
    await rotate('old')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each([429, 500, 502, 503])('preserves the session on upstream %i', async status => {
    fetcher.mockResolvedValue(new Response('', { status }))
    const { rotate } = await import('./rotation')
    expect(await rotate('old')).toEqual({ status: 'unavailable' })
  })
  it('distinguishes a rejected token', async () => {
    fetcher.mockResolvedValue(new Response('', { status: 401 }))
    const { rotate } = await import('./rotation')
    expect(await rotate('old')).toEqual({ status: 'invalid' })
  })
  it('recovers after a network failure', async () => {
    fetcher.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(Response.json({ data: { access: 'new' } }))
    const { rotate } = await import('./rotation')
    expect(await rotate('old')).toEqual({ status: 'unavailable' })
    expect((await rotate('old')).status).toBe('ok')
  })
})
