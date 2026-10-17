import { checkOrigin } from '@/lib/auth/origin'
import { NextResponse } from 'next/server'
import { API_BASE } from '@/lib/api/server-config'
import { backendFetch } from '@/lib/api/transport'
import { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions, refreshCookieOptions } from './cookies'

/**
 * Forward a sign-in to Django and move the issued tokens into cookies.
 *
 * `input` is the already-validated body, for callers that had to read the
 * request themselves; otherwise the request body is forwarded as-is.
 */
export async function loginResponse(request: Request, endpoint: string, input?: unknown) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected
  if (input === undefined) input = await request.json().catch(() => null)
  if (!input || typeof input !== 'object') return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  const upstream = await backendFetch(`${API_BASE}/api/v1/auth/${endpoint}/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(15_000),
  }, request).catch(() => null)
  if (!upstream) return NextResponse.json({ message: 'Service unavailable.' }, { status: 503 })
  const body = await upstream.json().catch(() => ({}))
  if (!upstream.ok) return NextResponse.json({
    message: body.message ?? 'Sign-in failed.', code: body.code, errors: body.errors ?? {},
  }, { status: upstream.status })
  const data = body.data
  if (!data?.user || !data?.tokens?.access || !data?.tokens?.refresh) {
    return NextResponse.json({ message: 'Invalid response from the service.' }, { status: 502 })
  }
  const res = NextResponse.json({ success: true, data: { user: data.user } })
  res.cookies.set(ACCESS_COOKIE, data.tokens.access, accessCookieOptions())
  res.cookies.set(REFRESH_COOKIE, data.tokens.refresh, refreshCookieOptions())
  return res
}
