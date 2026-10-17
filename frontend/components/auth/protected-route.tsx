"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuthStore } from "@/store/auth-store"

import FullScreenLoader from "@/components/common/full-screen-loader"

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter()

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  )

  const isLoading = useAuthStore(
    (state) => state.isLoading,
  )

    useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
        router.replace("/login")
    }
    }, [
    isLoading,
    isAuthenticated,
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

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}