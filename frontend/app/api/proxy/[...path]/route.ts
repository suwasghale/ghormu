import { checkOrigin } from '@/lib/auth/origin'
import { backendFetch } from '@/lib/api/transport'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE } from '@/lib/api/server-config'
import { ACCESS_COOKIE } from '@/lib/auth/cookies'

/**
 * Authenticated pass-through to the Django API.
 *
 * The session lives in an httpOnly cookie on *this* origin, so the browser
 * cannot attach it to a cross-origin request to Django, and it could not read
 * the token to send a bearer header even if we wanted it to. This handler is
 * the join: it reads the cookie server-side and forwards the request with an
 * `Authorization` header.
 *
 * It only ever forwards to `${API_BASE}/api/v1/...`, so a crafted path cannot
 * turn it into an open relay to an arbitrary host.
 */

/* Uploads stream a whole file through Next and on to object storage, so
   they get far longer than an ordinary JSON request. */
const REQUEST_TIMEOUT_MS = 15_000
const UPLOAD_TIMEOUT_MS = 120_000

async function forward(request: Request, path: string[]) {
  const rejected = checkOrigin(request)
  if (rejected) return rejected
  const access = (await cookies()).get(ACCESS_COOKIE)?.value
  const publicPaths = new Set(['auth/register', 'auth/email/verify', 'auth/email/resend', 'auth/password/forgot', 'auth/password/reset', 'auth/email/change/confirm', 'contact'])
  const route = path.join('/')
  if (['auth/login', 'auth/refresh', 'auth/mfa/verify'].includes(route) || route.startsWith('auth/social/')) {
    return NextResponse.json({ message: 'Use the dedicated authentication route.' }, { status: 404 })
  }
  if (path.some(segment => !/^[a-zA-Z0-9_-]+$/.test(segment))) return NextResponse.json({ message: 'Invalid path.' }, { status: 400 })
  if (!access && !(request.method === 'POST' && publicPaths.has(route))) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
  }

  const search = new URL(request.url).search

  /* Django's URLconf declares every admin route with a trailing slash, and
     Next strips trailing slashes from the incoming path before this handler
     sees it. Forwarding `/admin/users` therefore hits `APPEND_SLASH`, which
     answers 301 — and `fetch` follows a 301 by re-issuing it as GET. Reads
     survived that silently; every create and update would have been turned
     into a listing and reported success. */
  const target = `${API_BASE}/api/v1/${path.join('/')}/${search}`

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  /* The incoming content type is forwarded rather than assumed. Hardcoding
     JSON here meant a multipart upload arrived at Django labelled
     `application/json`, minus the boundary the parser needs — so the file
     never appeared in `request.FILES`. Bytes are forwarded as an
     ArrayBuffer for the same reason: `text()` would corrupt binary. */
  const contentType = request.headers.get('content-type')

  const upstream = await backendFetch(target, {
    method: request.method,
    headers: {
      Accept: 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(hasBody && contentType ? { 'Content-Type': contentType } : {}),
    },
    ...(hasBody ? { body: await request.arrayBuffer() } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(route === 'admin/media' ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS),
  }, request).catch(() => null)

  if (!upstream) {
    return NextResponse.json({ message: 'Service unavailable.' }, { status: 503 })
  }

  if (upstream.status === 204) return new NextResponse(null, { status: 204 })

  let body = await upstream.text()
  if (route === 'admin/media' && upstream.ok) {
    const payload = JSON.parse(body)
    if (payload.data?.url) {
      const url = new URL(payload.data.url, API_BASE)
      if (url.origin === new URL(API_BASE).origin) payload.data.url = `/api/media${url.pathname.replace(/^\/media/, '')}`
    }
    body = JSON.stringify(payload)
  }
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}

type Ctx = { params: Promise<{ path: string[] }> }

export async function GET(req: Request, ctx: Ctx) { return forward(req, (await ctx.params).path) }
export async function POST(req: Request, ctx: Ctx) { return forward(req, (await ctx.params).path) }
export async function PUT(req: Request, ctx: Ctx) { return forward(req, (await ctx.params).path) }
export async function PATCH(req: Request, ctx: Ctx) { return forward(req, (await ctx.params).path) }
export async function DELETE(req: Request, ctx: Ctx) { return forward(req, (await ctx.params).path) }
