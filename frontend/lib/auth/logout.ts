// ============================================================================
// Logout Flow
// ============================================================================

import { logoutApi } from "@/lib/api/auth/logout"


import { useAuthStore } from "@/store/auth-store"

export async function logout(): Promise<void> {
  try {
    await logoutApi()
  } catch {
    //
    // Ignore API failures during logout.
    // Client cleanup must always happen.
    //
  }


  useAuthStore.getState().logout()
}