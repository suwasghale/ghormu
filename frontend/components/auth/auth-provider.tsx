"use client"

import { useEffect } from "react"

import { getCurrentUser } from "@/lib/api/auth/me"

import { useAuthStore } from "@/store/auth-store"

type Props = {
  children: React.ReactNode
}

export default function AuthProvider({
  children,
}: Props) {
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    async function restoreSession() {
      setLoading(true)

      try {
        const user = await getCurrentUser()

        login(user)
      } catch {
        logout()
      }
    }

    restoreSession()
  }, [login, logout, setLoading])


  return children
}