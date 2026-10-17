import { NextResponse } from 'next/server'
import { API_BASE } from '@/lib/api/server-config'
import { backendFetch } from '@/lib/api/transport'

/**
 * Which social providers the API has configured.
 *
 * Public, and never an error: the login page asks on every visit, and a
 * backend hiccup should hide the "Continue with…" buttons, not break the
 * password form next to them.
 */
export async function GET(request: Request) {
  const upstream = await backendFetch(`${API_BASE}/api/v1/auth/social/`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  }, request).catch(() => null)

  const body = upstream?.ok ? await upstream.json().catch(() => null) : null
  const providers = Array.isArray(body?.data?.providers)
    ? body.data.providers.filter((name: unknown): name is string => typeof name === 'string')
    : []

  return NextResponse.json({ providers })
}
