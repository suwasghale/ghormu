"use client"

import {
  BadgeCheck,
  Mail,
  Shield,
  UserCircle2,
} from "lucide-react"

import type { User } from "@/types/auth"

type ProfileHeaderProps = {
  user: User
}

export default function ProfileHeader({
  user,
}: ProfileHeaderProps) {
  const fullName = `${user.first_name} ${user.last_name}`.trim()

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="h-32 bg-linear-to-r from-black via-gray-900 to-gray-800" />

      <div className="relative px-8 pb-8">
        <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gray-100 shadow-lg">
              <UserCircle2 className="h-20 w-20 text-gray-400" />
            </div>

            <div className="pb-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {fullName || "Unnamed User"}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>

                {user.is_verified ? (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </div>
                ) : (
                  <div className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                    Email not verified
                  </div>
                )}

                {user.is_active && (
                  <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                    <Shield className="h-4 w-4" />
                    Active Account
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Account Type
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-900">
              {user.is_staff ? "Administrator" : "Member"}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}