// ============================================================================
// Verify Email API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type {
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "@/types/auth"

export async function verifyEmail(
  payload: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  return apiClient.post<VerifyEmailResponse>(
    "auth/email/change/confirm/",
    payload,
  )
}