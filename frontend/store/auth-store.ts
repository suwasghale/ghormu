// ============================================================================
// Authentication Store
// ============================================================================

import { create } from "zustand"
import { queryClient } from "@/lib/query/client"

import type { User } from "@/types/auth"

type AuthState = {
  user: User | null

  isAuthenticated: boolean
  isLoading: boolean

  setLoading: (loading: boolean) => void

  login: (
    user: User,
  ) => void

  logout: () => void

  setUser: (
    user: User | null,
  ) => void
}

export const useAuthStore =
  create<AuthState>((set, get) => ({
    user: null,

    isAuthenticated: false,

    // App starts restoring authentication
    isLoading: true,

    setLoading: (loading) =>
      set({
        isLoading: loading,
      }),

    login: (user) => {
      if (get().user?.id !== user.id) queryClient.clear()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    },

    logout: () => {
      queryClient.clear()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    },

    setUser: (user) =>
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }
    ),
  }))