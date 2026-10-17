// ============================================================================
// Reset Password API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/types/auth"

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return apiClient.post<ResetPasswordResponse>(
    "auth/password/reset/",
    payload,
  )
}