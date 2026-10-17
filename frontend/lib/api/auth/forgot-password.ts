// ============================================================================
// Forgot Password API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "@/types/auth"

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return apiClient.post<ForgotPasswordResponse>(
    "auth/password/forgot/",
    payload,
  )
}