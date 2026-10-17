/**
 * Centralized TanStack Query keys.
 *
 * Every query in the application must use these keys.
 *
 * Benefits:
 * - Autocomplete
 * - Type safety
 * - Consistent cache invalidation
 * - Prevents duplicated string literals
 */

export const queryKeys = {
  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  currentUser: () => ["me"] as const,

  socialProviders: () => ["social-providers"] as const,

  // ---------------------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------------------

  sessions: () => ["sessions"] as const,

  trustedDevices: () => ["trusted-devices"] as const,

  mfaStatus: () => ["mfa-status"] as const,

}