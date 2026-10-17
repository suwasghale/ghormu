// ============================================================================
// Logout API
// ============================================================================

import { apiClient } from "@/lib/api/client"

interface LogoutResponse {
  success: boolean
  message: string
}

export async function logoutApi(): Promise<void> {

  await apiClient.post<LogoutResponse>(
    "/auth/logout/",
    {},
  )
}