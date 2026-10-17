import { checkOrigin } from '@/lib/auth/origin'
import { backendFetch } from '@/lib/api/transport'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE } from '@/lib/api/server-config'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth/cookies'

/**
 * Ends the session.
 *
 * The cookies are cleared whatever Django answers. A failed upstream call must
 * not strand someone in a half-signed-in state on this device; the refresh
 * token is short-lived and the server-side revocation can be retried.
 */
export async function POST(request: Request) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected
  const jar = await cookies()
  const refresh = jar.get(REFRESH_COOKIE)?.value
  const access = jar.get(ACCESS_COOKIE)?.value

  if (refresh) {
    await backendFetch(`${API_BASE}/api/v1/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined)
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(ACCESS_COOKIE, '', clearCookieOptions())
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions())
  return res
}
