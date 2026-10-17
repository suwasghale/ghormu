// ============================================================================
// Revoke Session API
// ============================================================================

import { apiClient } from "@/lib/api/client"

interface RevokeSessionResponse {
  success: boolean
  message: string
}

export async function revokeSession(
  sessionId: string,
): Promise<RevokeSessionResponse> {
  return apiClient.delete<RevokeSessionResponse>(
    `/auth/security/sessions/${sessionId}/`,
  )
}