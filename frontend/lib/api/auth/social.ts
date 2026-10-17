// ============================================================================
// Social sign-in
// ============================================================================
//
// The flow, end to end:
//
//   1. `startSocialSignIn` asks the BFF for the provider URL. The BFF picks
//      the redirect URI itself and keeps the `state` in an httpOnly cookie.
//   2. The browser goes to the provider and comes back to
//      /auth/callback/{provider}?code=...&state=...
//   3. `completeSocialSignIn` posts code and state to the BFF, which checks
//      the state against the cookie before Django sees the code.
// ============================================================================

import { apiClient } from "@/lib/api/client"
import { toLoginResult, type LoginResult } from "@/lib/api/auth/login"
import type { LoginResponse } from "@/types/auth"

/** Where to go after sign-in. Kept for the round trip to the provider. */
const RETURN_PATH_KEY = "social-sign-in:next"

interface ProvidersResponse {
  providers: string[]
}

interface AuthorizeResponse {
  authorization_url: string
}

export async function getSocialProviders(): Promise<string[]> {
  const response = await apiClient.get<ProvidersResponse>("/api/auth/social", {
    auth: false,
  })

  return response.providers
}

/** Send the browser to the provider. Does not resolve on success. */
export async function startSocialSignIn(
  provider: string,
  returnPath: string | null,
): Promise<void> {
  const response = await apiClient.post<AuthorizeResponse>(
    `/api/auth/social/${encodeURIComponent(provider)}/authorize`,
    {},
    { auth: false },
  )

  try {
    if (returnPath) sessionStorage.setItem(RETURN_PATH_KEY, returnPath)
    else sessionStorage.removeItem(RETURN_PATH_KEY)
  } catch {
    // Storage can be unavailable; sign-in then lands on the default page.
  }

  window.location.assign(response.authorization_url)
}

export async function completeSocialSignIn(
  provider: string,
  payload: { code: string; state: string },
): Promise<LoginResult> {
  return toLoginResult(
    apiClient.post<LoginResponse>(
      `/api/auth/social/${encodeURIComponent(provider)}/callback`,
      payload,
      { auth: false },
    ),
  )
}

/** The return path saved by `startSocialSignIn`, consumed once. */
export function takeSocialReturnPath(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_PATH_KEY)
    sessionStorage.removeItem(RETURN_PATH_KEY)
    return value
  } catch {
    return null
  }
}
