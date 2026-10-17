"use client"

import { MonitorSmartphone } from "lucide-react"

import {
  useRevokeSession,
  useTrustDevice,
} from "@/hooks/mutations/use-session-actions"
import { useSessions } from "@/hooks/queries/use-sessions"

import SessionCard from "./session-card"

export default function ActiveSessionsCard() {
  const { data: sessions = [], isPending: loading, isError } = useSessions()

  const revoke = useRevokeSession()
  const trust = useTrustDevice()

  const error = isError ? "Unable to load active sessions." : ""

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

      {/* Header */}

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-gray-100 p-3">
          <MonitorSmartphone className="h-6 w-6" />
        </div>

        <div>

          <h2 className="text-xl font-semibold">
            Active Sessions
          </h2>

          <p className="text-sm text-gray-500">
            Devices currently signed in to your account.
          </p>

        </div>

      </div>

      {/* Loading */}

      {loading && (
        <div className="space-y-4">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}

        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}

      {!loading &&
        !error &&
        sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">

            <MonitorSmartphone className="mx-auto mb-3 h-10 w-10 text-gray-400" />

            <h3 className="font-medium">
              No active sessions
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              No active login sessions were found.
            </p>

          </div>
        )}

      {/* Sessions */}

      {!loading &&
        !error &&
        sessions.length > 0 && (
          <div className="space-y-4">

            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onTrust={(id) => trust.mutate(id)}
                onRevoke={(id) => revoke.mutate(id)}
                trusting={
                  trust.isPending && trust.variables === session.id
                }
                revoking={
                  revoke.isPending && revoke.variables === session.id
                }
              />
            ))}

          </div>
        )}

    </section>
  )
}