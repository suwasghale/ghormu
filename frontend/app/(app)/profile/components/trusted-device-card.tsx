"use client"

import {
  Laptop,
  Smartphone,
  Globe,
  ShieldCheck,
  Shield,
} from "lucide-react"

import type { Session } from "@/types/security"

type Props = {
  session: Session

  onUntrust?: (id: string) => void

  loading?: boolean
}

export default function TrustedDeviceCard({
  session,
  onUntrust,
  loading = false,
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

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-semibold text-gray-900">
                {session.browser}
              </h3>

              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                Trusted
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              {session.operating_system}
              {session.operating_system_version &&
                ` ${session.operating_system_version}`}
            </p>

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

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onUntrust?.(session.id)
          }
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Shield className="h-4 w-4" />

          {loading
            ? "Removing..."
            : "Remove Trust"}
        </button>

      </div>

    </div>
  )
}