"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/store/auth-store"

import FullScreenLoader from "@/components/common/full-screen-loader"
import { getDefaultRedirect } from "@/lib/auth/redirect"

type GuestRouteProps = {
  children: ReactNode
}

export default function GuestRoute({
  children,
}: GuestRouteProps) {
  const router = useRouter()

  const user = useAuthStore((state) => state.user)

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  )

  const isLoading = useAuthStore(
    (state) => state.isLoading,
  )

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) {
      return
    }
    router.replace(getDefaultRedirect(user))
  }, [
    isLoading,
    isAuthenticated,
    user,
    router,
  ])

  if (isLoading) {
    return (
      <FullScreenLoader
        title="Checking authentication"
        description="Please wait while we verify your session."
      />
    )
  }

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}