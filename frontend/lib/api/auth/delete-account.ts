import { apiClient } from "@/lib/api/client"

interface DeleteAccountResponse {
  success: boolean
  message: string
}

/**
 * Soft deletes the account and revokes every session server-side.
 *
 * The session cookies on this device are not cleared by this call; follow
 * it with `logout()` so the browser does not keep sending dead tokens.
 */
export async function deleteAccount(payload: {
  password: string
  /** Required when two-factor authentication is enabled. */
  code?: string
}): Promise<DeleteAccountResponse> {
  return apiClient.delete<DeleteAccountResponse>("/auth/account/delete/", {
    body: {
      password: payload.password,
      ...(payload.code ? { code: payload.code.trim() } : {}),
    },
  })
}
