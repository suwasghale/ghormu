// ============================================================================
// Change Email Request API
// ============================================================================

import { apiClient } from "@/lib/api/client"

export interface ChangeEmailRequestPayload {
  new_email: string
}

export interface ChangeEmailRequestResponse {
  success: boolean
  message: string
}

export async function changeEmailRequest(
  payload: ChangeEmailRequestPayload,
): Promise<ChangeEmailRequestResponse> {
  return apiClient.post<ChangeEmailRequestResponse>(
    "/auth/email/change/request/",
    payload,
  )
}