import { checkOrigin } from '@/lib/auth/origin'
import { backendFetch } from '@/lib/api/transport'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE } from '@/lib/api/server-config'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth/cookies'

/** Revokes every session for the account, then clears this device's cookies. */
export async function POST(request: Request) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected
  const jar = await cookies()
  const access = jar.get(ACCESS_COOKIE)?.value

  const upstream = await backendFetch(`${API_BASE}/api/v1/auth/logout/all/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  }).catch(() => null)

  const res = NextResponse.json(
    { success: upstream?.ok ?? false },
    { status: upstream?.ok ? 200 : 502 },
  )
  res.cookies.set(ACCESS_COOKIE, '', clearCookieOptions())
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions())
  return res
}
