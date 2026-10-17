"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import ProtectedRoute from "@/components/auth/protected-route"
import FullScreenLoader from "@/components/common/full-screen-loader"

import { useCurrentUser } from "@/hooks/queries/use-current-user"
import { logout } from "@/lib/auth/logout"

import { useAuthStore } from "@/store/auth-store"


import ProfileHeader from "./components/profile-header"
import ProfileInfoCard from "./components/profile-info-card"
import SecurityCard from "./components/security-card"
import DangerZone from "./components/danger-zone"
import ActiveSessionsCard from "./components/active-sessions-card"
import TrustedDevicesCard from "./components/trusted-devices-card"
import ProfileForm from "./components/profile-form"

export default function ProfilePage() {
  const router = useRouter()

  const { data: user, isLoading: loading, isError } = useCurrentUser()

  useEffect(() => {
    if (isError) router.replace("/login")
  }, [isError, router])

  async function handleLogout() {
    await logout()

    useAuthStore.getState().logout()

    router.replace("/login")
  }

  if (loading) {
    return (
      <FullScreenLoader
        title="Loading profile"
        description="Preparing your account settings..."
      />
    )
  }

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
          <ProfileHeader user={user} />

          <ProfileInfoCard user={user} />
          
          <ActiveSessionsCard />

          <TrustedDevicesCard />

            <ProfileForm
            defaultValues={{
              first_name: user.first_name ?? "",
              last_name: user.last_name ?? "",
              gender: user.profile?.gender ?? "",
              date_of_birth: user.profile?.date_of_birth ?? "",
              nationality: user.profile?.nationality ?? "",
              phone_number: user.profile?.phone_number ?? "",
              biography: user.profile?.biography ?? "",
              preferred_language: user.profile?.preferred_language ?? "ne",
              timezone: user.profile?.timezone ?? "UTC",
            }}
          />

          <SecurityCard />

          <DangerZone
            onLogout={handleLogout}
          />
        </div>
      </main>
    </ProtectedRoute>
  )
}