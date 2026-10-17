"use client"

import { ShieldCheck } from "lucide-react"

import { useUntrustDevice } from "@/hooks/mutations/use-session-actions"
import { useTrustedDevices } from "@/hooks/queries/use-sessions"

import TrustedDeviceCard from "./trusted-device-card"

export default function TrustedDevicesCard() {
  const {
    data: devices = [],
    isPending: loading,
    isError,
  } = useTrustedDevices()

  const untrust = useUntrustDevice()

  const error = isError ? "Unable to load trusted devices." : ""

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-gray-100 p-3">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <div>

          <h2 className="text-xl font-semibold">
            Trusted Devices
          </h2>

          <p className="text-sm text-gray-500">
            Devices you have marked as trusted.
          </p>

        </div>

      </div>

      {/* ====================================================== */}
      {/* Loading */}
      {/* ====================================================== */}

      {loading && (
        <div className="space-y-4">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}

        </div>
      )}

      {/* ====================================================== */}
      {/* Error */}
      {/* ====================================================== */}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* Empty */}
      {/* ====================================================== */}

      {!loading &&
        !error &&
        devices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">

            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-400" />

            <h3 className="font-medium">
              No trusted devices
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Trusted devices will appear here after you mark them from Active Sessions.
            </p>

          </div>
        )}

      {/* ====================================================== */}
      {/* Trusted Devices */}
      {/* ====================================================== */}

      {!loading &&
        !error &&
        devices.length > 0 && (
          <div className="space-y-4">

            {devices.map((device) => (
              <TrustedDeviceCard
                key={device.id}
                session={device}
                loading={
                  untrust.isPending && untrust.variables === device.id
                }
                onUntrust={(id) => untrust.mutate(id)}
              />
            ))}

          </div>
        )}

    </section>
  )
}