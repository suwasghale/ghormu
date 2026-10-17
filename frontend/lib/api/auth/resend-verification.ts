// ============================================================================
// Resend Verification Email API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type {
  ResendVerificationRequest,
  ResendVerificationResponse,
} from "@/types/auth"

export async function resendVerificationEmail(
  payload: ResendVerificationRequest,
): Promise<ResendVerificationResponse> {
  return apiClient.post<ResendVerificationResponse>(
    "auth/email/resend/",
    payload,
  )
}