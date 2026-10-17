import 'server-only'

/** Provider names are path segments on both this app and the API. */
export function isProviderName(value: string): boolean {
  return /^[a-z][a-z0-9-]{0,31}$/.test(value)
}

/**
 * Where the provider sends the browser back to.
 *
 * Built from the configured public origin, the same one `checkOrigin`
 * trusts. The API only accepts redirect URIs on its CORS allow-list, and
 * the provider only accepts ones registered in its console, so this must
 * match both exactly.
 */
export function socialRedirectUri(request: Request, provider: string): string {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin
  return `${origin}/auth/callback/${provider}`
}

export function readOAuthState(raw: string | undefined): { provider: string; state: string } | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    return typeof value?.provider === 'string' && typeof value?.state === 'string' ? value : null
  } catch {
    return null
  }
}
