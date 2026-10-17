import { checkOrigin } from '@/lib/auth/origin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { rotate, type Tokens } from '@/lib/auth/rotation'
import { safeReturnPath } from '@/lib/auth/redirect'
import { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions, refreshCookieOptions, clearCookieOptions } from '@/lib/auth/cookies'

function redirect(path: string) {
  // Relative Location keeps the browser on its public origin behind any proxy.
  return new NextResponse(null, { status: 307, headers: { Location: path, 'Cache-Control': 'no-store' } })
}
function applyTokens(res: NextResponse, tokens: Tokens) {
  res.cookies.set(ACCESS_COOKIE, tokens.access, accessCookieOptions())
  if (tokens.refresh) res.cookies.set(REFRESH_COOKIE, tokens.refresh, refreshCookieOptions())
  return res
}
function clearSession(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', clearCookieOptions())
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions())
  return res
}
function unavailable() {
  return NextResponse.json({ message: 'Service temporarily unavailable. Please try again.' }, {
    status: 503, headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' },
  })
}
export async function POST(request: Request) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value
  if (!refresh) return clearSession(NextResponse.json({ message: 'Session expired.' }, { status: 401 }))
  const result = await rotate(refresh, request)
  if (result.status === 'unavailable') return unavailable()
  if (result.status === 'invalid') return clearSession(NextResponse.json({ message: 'Session expired.' }, { status: 401 }))
  return applyTokens(NextResponse.json({ success: true }), result.tokens)
}
export async function GET(request: Request) {
  const next = safeReturnPath(new URL(request.url).searchParams.get('next'))
  const expired = `/login?next=${encodeURIComponent(next)}&expired=1`
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value
  if (!refresh) return clearSession(redirect(expired))
  const result = await rotate(refresh, request)
  if (result.status === 'unavailable') return unavailable()
  if (result.status === 'invalid') return clearSession(redirect(expired))
  return applyTokens(redirect(next), result.tokens)
}
