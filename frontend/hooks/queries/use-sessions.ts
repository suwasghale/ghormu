"use client"

import { useQuery } from "@tanstack/react-query"

import { getSessions } from "@/lib/api/security/sessions"
import { getTrustedDevices } from "@/lib/api/security/trusted-devices"
import { queryKeys } from "@/lib/query/keys"

/** Sessions change whenever anyone signs in, so they are never cached long. */
const SESSION_STALE_TIME = 30 * 1000

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions(),
    queryFn: getSessions,
    staleTime: SESSION_STALE_TIME,
  })
}

export function useTrustedDevices() {
  return useQuery({
    queryKey: queryKeys.trustedDevices(),
    queryFn: getTrustedDevices,
    staleTime: SESSION_STALE_TIME,
  })
}
