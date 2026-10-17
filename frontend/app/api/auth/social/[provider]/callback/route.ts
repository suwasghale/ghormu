import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { checkOrigin } from '@/lib/auth/origin'
import { loginResponse } from '@/lib/auth/login-response'
import { OAUTH_STATE_COOKIE, clearCookieOptions } from '@/lib/auth/cookies'
import { isProviderName, readOAuthState } from '@/lib/auth/social'

type Ctx = { params: Promise<{ provider: string }> }

const EXPIRED = 'This sign-in attempt has expired. Please try again.'

/**
 * Finish a social sign-in.
 *
 * The state must match the cookie set when this browser started the
 * sign-in. The cookie is cleared whatever happens: a state is single-use
 * on the API too, so a second attempt with it could only fail.
 */
export async function POST(request: Request, ctx: Ctx) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected

  const { provider } = await ctx.params
  if (!isProviderName(provider)) {
    return NextResponse.json({ message: 'Unknown sign-in provider.' }, { status: 404 })
  }

  const input = await request.json().catch(() => null)
  const code = typeof input?.code === 'string' ? input.code : ''
  const state = typeof input?.state === 'string' ? input.state : ''

  const issued = readOAuthState((await cookies()).get(OAUTH_STATE_COOKIE)?.value)

  const res = !code || !state || issued?.provider !== provider || issued.state !== state
    ? NextResponse.json({ message: EXPIRED, code: 'social_state_mismatch' }, { status: 400 })
    : await loginResponse(request, `social/${provider}/callback`, { code, state })

  res.cookies.set(OAUTH_STATE_COOKIE, '', clearCookieOptions())
  return res
}
