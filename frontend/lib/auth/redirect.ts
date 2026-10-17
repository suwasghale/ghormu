/** Return a normalized application path, never a different origin. */
export function safeReturnPath(raw: string | null | undefined): string {
  const origin = 'https://return.invalid'
  if (!raw?.startsWith('/') || /[\\\u0000-\u0020]/.test(raw)) return '/admin'
  try {
    const url = new URL(raw, origin)
    return url.origin === origin ? url.pathname + url.search + url.hash : '/admin'
  } catch {
    return '/admin'
  }
}

import type { User } from "@/types/auth"

export function getDefaultRedirect(user: User) {
  return user.is_staff
    ? "/admin/dashboard"
    : "/profile"
}
/**
 * Where to send someone who has just signed in.
 *
 * Honours a requested return path when it is a safe, same-origin path the
 * user may actually open; staff-only pages are not offered to everyone
 * else, who would only be bounced again.
 */
export function postLoginPath(user: User, requested: string | null | undefined) {
  if (!requested) return getDefaultRedirect(user)

  const path = safeReturnPath(requested)

  if (!user.is_staff && (path === "/admin" || path.startsWith("/admin/"))) {
    return getDefaultRedirect(user)
  }

  return path
}
