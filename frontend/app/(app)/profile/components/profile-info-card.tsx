"use client"

import {
  BadgeCheck,
  CalendarDays,
  Mail,
  User2,
} from "lucide-react"

import type { User } from "@/types/auth"

type ProfileInfoCardProps = {
  user: User
}

type InfoItemProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoItem({
  icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-colors hover:border-gray-300 hover:bg-white">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
        {icon}
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-base font-semibold text-gray-900">
        {value}
      </p>
    </div>
  )
}

export default function ProfileInfoCard({
  user,
}: ProfileInfoCardProps) {
  const fullName = `${user.first_name} ${user.last_name}`

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">
          Personal Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Your basic account details.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InfoItem
          icon={<User2 className="h-5 w-5" />}
          label="Full Name"
          value={fullName}
        />

        <InfoItem
          icon={<Mail className="h-5 w-5" />}
          label="Email Address"
          value={user.email}
        />

        <InfoItem
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Email Verification"
          value={
            user.is_verified
              ? "Verified"
              : "Not Verified"
          }
        />

        <InfoItem
          icon={<CalendarDays className="h-5 w-5" />}
          label="Account Status"
          value={
            user.is_active
              ? "Active"
              : "Inactive"
          }
        />
      </div>
    </section>
  )
}