// ============================================================================
// Register API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type {
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth"

// ============================================================================
// Public API
// ============================================================================

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>(
    "/auth/register/",
    payload,
  )
}