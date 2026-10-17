"use client"

import { useCurrentUser } from "@/hooks/queries/use-current-user"

import ProfileForm from "./profile-form"

export default function EditProfileCard() {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useCurrentUser()

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-500">
          Loading profile...
        </p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "Unable to load profile."}
        </p>
      </section>
    )
  }

  if (!user) return null

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl font-bold">
          Edit Profile
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Update your personal information.
        </p>
      </div>

  <ProfileForm
  defaultValues={{
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    gender: user.profile?.gender ?? "",
    date_of_birth: user.profile?.date_of_birth ?? "",
    nationality: user.profile?.nationality ?? "",
    phone_number: user.profile?.phone_number ?? "",
    biography: user.profile?.biography ?? "",
    preferred_language: user.profile?.preferred_language ?? "en",
    timezone: user.profile?.timezone ?? "UTC",
  }}
/>

    </section>
  )
}