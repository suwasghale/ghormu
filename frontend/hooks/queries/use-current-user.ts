"use client"

import { useQuery } from "@tanstack/react-query"

import { getCurrentUser } from "@/lib/api/auth/me"
import { queryKeys } from "@/lib/query/keys"

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: getCurrentUser,

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 30,

    retry: 1,

    refetchOnWindowFocus: false,
  })
}