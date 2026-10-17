import { createHash } from 'node:crypto'
import { API_BASE } from '@/lib/api/server-config'
import { backendFetch } from '@/lib/api/transport'

export interface Tokens { access: string; refresh?: string }
export type Rotation = { status: 'ok'; tokens: Tokens } | { status: 'invalid' } | { status: 'unavailable' }
// Coalesce calls in this process to reduce traffic. The trusted backend
// also coordinates across frontend instances and recovers lost responses.
const rotations = new Map<string, { until: number; promise: Promise<Rotation> }>()
export function rotate(refresh: string, request?: Request): Promise<Rotation> {
  const key = createHash('sha256').update(refresh).digest('hex')
  const now = Date.now()
  for (const [k, item] of rotations) if (item.until < now) rotations.delete(k)
  const existing = rotations.get(key)
  if (existing) return existing.promise
  if (rotations.size >= 256) return Promise.resolve({ status: 'unavailable' })
  const promise = (async (): Promise<Rotation> => {
    try {
      const upstream = await backendFetch(`${API_BASE}/api/v1/auth/refresh/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }), signal: AbortSignal.timeout(10_000),
      }, request)
      if ([400, 401, 403].includes(upstream.status)) return { status: 'invalid' }
      if (!upstream.ok) return { status: 'unavailable' }
      const body = await upstream.json()
      return body?.data?.access ? { status: 'ok', tokens: body.data } : { status: 'unavailable' }
    } catch { return { status: 'unavailable' } }
  })()
  rotations.set(key, { until: now + 15_000, promise })
  void promise.then(result => {
    if (result.status === 'ok') rotations.set(key, { until: Date.now() + 5_000, promise })
    else rotations.delete(key)
  })
  return promise
}
