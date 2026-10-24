import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies'
import { defaultLocale, isLocale, LOCALE_COOKIE, locales, localizePath } from '@/lib/i18n/config'

/**
 * Route protection at the edge, before any admin page renders.
 *
 * Was `middleware.ts` until Next 16 replaced that file convention with
 * `proxy.ts`.
 *
 * This never verifies a token. It runs on every matched request, and checking
 * the JWT here would mean a call to Django each time; it cannot be verified
 * locally either without shipping the signing secret into the edge runtime.
 * The real check is `requireAdmin()` in the admin layout, which asks the API.
 *
 * What it *does* have to get right is which cookie means what, because the
 * access cookie lives 15 minutes and the refresh cookie 7 days:
 *
 *   - access present   → a session that `getSession()` can validate. Pass.
 *   - refresh only     → the access token expired. `getSession()` reads only
 *                        the access cookie, so it would see nothing and send
 *                        the visitor to /login; and a signed-in visitor at
 *                        /login used to be bounced straight back to /admin.
 *                        That mutual disagreement is an infinite redirect
 *                        between the two, roughly a quarter-hour into every
 *                        admin session. The refresh cookie is now redeemed
 *                        first, in a route handler that can actually write the
 *                        renewed cookies back.
 *   - neither          → anonymous. Sign in.
 */
/**
 * Whether this is a real top-level navigation, as opposed to a prefetch or an
 * RSC payload fetch.
 *
 * This gate is load-bearing, not tidiness. The backend rotates refresh tokens
 * and blacklists the old one, and it treats a *replayed* refresh token as theft
 * — `refresh_tokens()` calls `logout_all()` and revokes every session the user
 * has. Next fires prefetches and RSC requests for the same route alongside the
 * document request, so renewing on all of them would send several rotations of
 * one cookie at once: the first succeeds, the rest look like replay, and the
 * user is signed out everywhere. Renewal therefore happens on the one request
 * that can actually receive the new cookies and act on them.
 */
function isDocumentNavigation(request: NextRequest): boolean {
  const h = request.headers

  /* `Sec-Fetch-Dest` is the signal that actually survives. Next's own
     `Next-Router-Prefetch` and `RSC` markers were the obvious choice, but they
     do not reach this function — measured, not assumed: a probe here reported
     both as null on requests that carried them, while `Sec-Fetch-*` came
     through intact. Those are browser-set and cannot be consumed upstream:
     `document` for a real navigation, `empty` for the router's own fetches. */
  const dest = h.get('sec-fetch-dest')
  if (dest !== null) return dest === 'document'

  const mode = h.get('sec-fetch-mode')
  if (mode !== null) return mode === 'navigate'

  // Pre-Sec-Fetch browser. Renewing is the better failure: the alternative is
  // a session that can never come back.
  return true
}

/**
 * The first path segment of every address the app answers: the two
 * languages, the account and admin screens, the API, and the folders under
 * public/. A test keeps it in step with app/ and public/.
 */
export const KNOWN_ROOTS: ReadonlySet<string> = new Set([
  ...locales,
  '_next',
  'api',
  'admin',
  'auth',
  'profile',
  'login',
  'register',
  'registration-success',
  'forgot-password',
  'reset-password',
  'verify-email',
  'change-email',
  'resend-verification',
  'icons',
  'images',
  'vendor',
])

/**
 * Where an unknown address (`/fr`, `/fr/about`, `/xyz`) is sent, unseen.
 *
 * Next 16 answers some of these with its bare built-in error document
 * instead of app/global-not-found.tsx: an unknown "language" in front of a
 * prebuilt page (`/fr/about`) has no fallback. This address always reaches
 * the catch-all page, whose layout turns it down with the designed 404.
 */
const UNKNOWN_ADDRESS = '/__unknown/address'

function isUnknownAddress(pathname: string): boolean {
  const first = pathname.split('/')[1] ?? ''
  // Files (sw.js, robots.txt) and Next's own __ paths are not ours to judge.
  return !KNOWN_ROOTS.has(first) && !first.includes('.') && !first.startsWith('__')
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const access = request.cookies.get(ACCESS_COOKIE)?.value
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value

  /* The public site lives under /ne and /en. Bare `/` goes to the language
     the visitor last picked, or Nepali for anyone who has not picked one.
     Temporary (307), because the answer depends on the cookie. */
  if (pathname === '/') {
    const preferred = request.cookies.get(LOCALE_COOKIE)?.value
    const locale = isLocale(preferred) ? preferred : defaultLocale
    return NextResponse.redirect(new URL(localizePath(locale, '/') + search, request.url))
  }

  if (isUnknownAddress(pathname)) {
    return NextResponse.rewrite(new URL(UNKNOWN_ADDRESS, request.url))
  }

  if ((pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/profile' || pathname.startsWith('/profile/'))) {
    if (access) return NextResponse.next()

    if (refresh && isDocumentNavigation(request)) {
      // The handler sets the renewed cookies and redirects back here, at
      // which point `access` exists.
      const renew = new URL('/api/auth/refresh', request.url)
      renew.searchParams.set('next', pathname + search)
      return NextResponse.redirect(renew)
    }

    /* An expired prefetch or RSC fetch falls through to the layout, which
       sends it to /login. That response is discarded by the router, and the
       real navigation behind it does the renewal — see the note on
       `isDocumentNavigation`. */
    if (refresh) return NextResponse.next()

    const login = new URL('/login', request.url)
    // Carries the intended destination so sign-in can return there.
    login.searchParams.set('next', pathname + search)
    return NextResponse.redirect(login)
  }

  /* A signed-in user landing on /login goes to the admin instead of a form
     they have already passed — unless they arrived carrying `expired`, which
     is how the admin layout says "this cookie exists but the API rejected it".
     Bouncing that back to /admin is precisely the loop, so the marker wins and
     the form renders. */
  if (pathname === '/login' && access && !request.nextUrl.searchParams.has('expired')) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  return NextResponse.next()
}

export const config = {
  /* Only the routes that need it. Matching everything would put this in front
     of all the static pages under /ne and /en for no benefit; the last entry
     takes everything else, for `isUnknownAddress`. */
  matcher: ['/', '/admin/:path*', '/profile/:path*', '/login', '/((?!ne/|en/|_next/|api/).*)'],
}
