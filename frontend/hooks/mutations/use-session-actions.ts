"use client"

// ============================================================================
// Session and trusted-device mutations
// ============================================================================
//
// A trusted device is a session with a flag, so every action here changes
// both lists. Each mutation invalidates both, which keeps the Active
// Sessions and Trusted Devices cards in agreement without either one
// patching the other's state by hand.
// ============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api/errors"
import { revokeSession } from "@/lib/api/security/revoke-session"
import { trustDevice } from "@/lib/api/security/trust-device"
import { untrustDevice } from "@/lib/api/security/untrust-device"
import { queryKeys } from "@/lib/query/keys"

function useSessionMutation(
  mutationFn: (sessionId: string) => Promise<unknown>,
  messages: { success: string; failure: string },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,

    // Retrying a revoke or trust is not idempotent from the user's point
    // of view; a failure should be reported, not repeated.
    retry: false,

    onSuccess: () => {
      toast.success(messages.success)
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error, messages.failure))
    },

    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trustedDevices() }),
      ]),
  })
}

export function useRevokeSession() {
  return useSessionMutation(revokeSession, {
    success: "Session signed out.",
    failure: "Unable to revoke session.",
  })
}

export function useTrustDevice() {
  return useSessionMutation(trustDevice, {
    success: "Device trusted.",
    failure: "Unable to trust device.",
  })
}

export function useUntrustDevice() {
  return useSessionMutation(untrustDevice, {
    success: "Device removed from trusted devices.",
    failure: "Unable to remove trusted device.",
  })
}
