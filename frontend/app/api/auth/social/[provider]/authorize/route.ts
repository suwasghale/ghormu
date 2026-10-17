import { NextResponse } from 'next/server'
import { checkOrigin } from '@/lib/auth/origin'
import { API_BASE } from '@/lib/api/server-config'
import { backendFetch } from '@/lib/api/transport'
import { OAUTH_STATE_COOKIE, oauthStateCookieOptions } from '@/lib/auth/cookies'
import { isProviderName, socialRedirectUri } from '@/lib/auth/social'

type Ctx = { params: Promise<{ provider: string }> }

/**
 * Start a social sign-in.
 *
 * The redirect URI is chosen here, from this app's configured origin, and
 * never taken from the browser. The `state` Django issues is kept in an
 * httpOnly cookie so the callback can prove it is finishing a sign-in this
 * browser started — without that, an attacker could complete their own
 * authorization and plant the resulting code in a victim's browser.
 */
export async function POST(request: Request, ctx: Ctx) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected

  const { provider } = await ctx.params
  if (!isProviderName(provider)) {
    return NextResponse.json({ message: 'Unknown sign-in provider.' }, { status: 404 })
  }

  const upstream = await backendFetch(`${API_BASE}/api/v1/auth/social/${provider}/authorize/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ redirect_uri: socialRedirectUri(request, provider) }),
  }, request).catch(() => null)

  if (!upstream) return NextResponse.json({ message: 'Service unavailable.' }, { status: 503 })

  const body = await upstream.json().catch(() => ({}))

  if (!upstream.ok) {
    return NextResponse.json({
      message: body.message ?? 'Sign-in with this provider is unavailable.',
      code: body.code,
      errors: body.errors ?? {},
    }, { status: upstream.status })
  }

  const url = body.data?.authorization_url
  const state = body.data?.state
  if (typeof url !== 'string' || typeof state !== 'string') {
    return NextResponse.json({ message: 'Invalid response from the service.' }, { status: 502 })
  }

  const res = NextResponse.json({ authorization_url: url })
  res.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ provider, state }), oauthStateCookieOptions())
  return res
}
