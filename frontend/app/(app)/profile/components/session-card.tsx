"use client"

import {
  Laptop,
  Smartphone,
  Globe,
  ShieldCheck,
  Shield,
  Trash2,
} from "lucide-react"

import type { Session } from "@/types/security"

type Props = {
  session: Session

  onTrust?: (id: string) => void
  onRevoke?: (id: string) => void

  trusting?: boolean
  revoking?: boolean
}

export default function SessionCard({
  session,
  onTrust,
  onRevoke,
  trusting = false,
  revoking = false,
}: Props) {
  const isMobile =
    session.device_type.toLowerCase() === "mobile"

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm">

      <div className="flex items-start justify-between">

        {/* ====================================================== */}
        {/* Left */}
        {/* ====================================================== */}

        <div className="flex gap-4">

          <div className="rounded-xl bg-gray-100 p-3">
            {isMobile ? (
              <Smartphone className="h-6 w-6" />
            ) : (
              <Laptop className="h-6 w-6" />
            )}
          </div>

          <div>

            {/* ------------------------------------------------ */}

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-semibold text-gray-900">
                {session.browser}
              </h3>

              {session.is_current && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Current Session
                </span>
              )}

              {session.is_trusted && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Trusted
                </span>
              )}

            </div>

            {/* ------------------------------------------------ */}

            <p className="mt-1 text-sm text-gray-500">
              {session.operating_system}
              {session.operating_system_version &&
                ` ${session.operating_system_version}`}
            </p>

            {/* ------------------------------------------------ */}

            <div className="mt-4 space-y-2 text-sm text-gray-500">

              <div className="flex items-center gap-2">

                <Globe className="h-4 w-4" />

                <span>
                  {session.city ||
                    session.ip_address}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <ShieldCheck className="h-4 w-4" />

                <span>
                  Last active{" "}
                  {new Date(
                    session.last_activity,
                  ).toLocaleString()}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================== */}
        {/* Right */}
        {/* ====================================================== */}

        {!session.is_current && (

          <div className="flex flex-col gap-2">

            {!session.is_trusted && (
              <button
                type="button"
                disabled={trusting}
                onClick={() =>
                  onTrust?.(session.id)
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />

                {trusting
                  ? "Trusting..."
                  : "Trust Device"}
              </button>
            )}

            <button
              type="button"
              disabled={revoking}
              onClick={() =>
                onRevoke?.(session.id)
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />

              {revoking
                ? "Revoking..."
                : "Revoke"}
            </button>

          </div>

        )}

      </div>

    </div>
  )
}