"use client"

import Link from "next/link"

import {
  ChevronRight,
  KeyRound,
  Laptop,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { useMfaStatus } from "@/hooks/queries/use-mfa-status"

type SecurityActionProps = {
  href?: string
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  disabled?: boolean
}

function SecurityAction({
  href,
  icon,
  title,
  description,
  badge,
  disabled = false,
}: SecurityActionProps) {
  const content = (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border border-gray-200 p-5 transition-all",
        disabled
          ? "cursor-not-allowed bg-gray-50 opacity-70"
          : "hover:border-black hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
          {icon}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {title}
            </h3>

            {badge && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {badge}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {!disabled && (
        <ChevronRight className="h-5 w-5 text-gray-400" />
      )}
    </div>
  )

  if (disabled || !href) {
    return content
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}

export default function SecurityCard() {
  const { data: mfa } = useMfaStatus()

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">
          Security
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and active devices.
        </p>
      </div>

      <div className="space-y-4">
        <SecurityAction
          href="/profile/change-password"
          icon={<KeyRound className="h-5 w-5" />}
          title="Change Password"
          description="Update your account password regularly to keep your account secure."
        />

        <SecurityAction
          href="/profile/change-email"
          icon={<Mail className="h-5 w-5" />}
          title="Change Email"
          description="Change your email."
        />

        <SecurityAction
          href="/profile/two-factor"
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Two-factor Authentication"
          description="Require a code from an authenticator app when you sign in."
          badge={mfa ? (mfa.enabled ? "On" : "Off") : undefined}
        />

        <SecurityAction
          href="/profile/sessions"
          icon={<Laptop className="h-5 w-5" />}
          title="Active Sessions"
          description="Review and manage devices currently signed into your account."
        />

      </div>
    </section>
  )
}