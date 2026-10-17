// ============================================================================
// Active Sessions API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type { Session } from "@/types/security"

// ============================================================================
// Response
// ============================================================================

interface SessionsResponse {
  success: boolean
  message: string
  data: Session[]
}

// ============================================================================
// Public API
// ============================================================================

export async function getSessions(): Promise<Session[]> {

  const response = await apiClient.get<SessionsResponse>(
    "/auth/security/sessions/",
  )
  
  return response.data
}