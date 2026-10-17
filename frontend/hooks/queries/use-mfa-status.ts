"use client"

import { useQuery } from "@tanstack/react-query"

import { getMfaStatus } from "@/lib/api/auth/mfa"
import { queryKeys } from "@/lib/query/keys"

export function useMfaStatus() {
  return useQuery({
    queryKey: queryKeys.mfaStatus(),
    queryFn: getMfaStatus,
  })
}
