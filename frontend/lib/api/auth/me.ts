// ============================================================================
// Current User API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type { User } from "@/types/auth"

interface MeResponse {
  success: boolean
  message: string
  data: User
}

export async function getCurrentUser(): Promise<User> {

  const response = await apiClient.get<MeResponse>(
    "/auth/me/"
  )

  const profile = await apiClient.get<{ data: User["profile"] }>("/me/profile/")
  return { ...response.data, profile: profile.data }
}