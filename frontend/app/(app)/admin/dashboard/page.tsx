"use client"

// ============================================================================
// Admin dashboard
// ============================================================================
//
// Counters for every resource, from one endpoint. The previous version
// loaded the current user and their sessions and logged them to the
// console — useful while the shell was being built, not a dashboard.
// ============================================================================

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import {
  errorMessage,
  getDashboardStats,
  type DashboardStats,
} from "@/lib/api/admin/client"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getDashboardStats()

        if (!cancelled) setStats(data)
      } catch (caught) {
        if (!cancelled) {
          setError(
            errorMessage(caught, "Could not load the dashboard."),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <AlertCircle size={20} className="mx-auto text-red-500" />
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your application and user accounts.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* Headline figures                                                     */}
      {/* ==================================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total accounts" value={stats.users.total} hint="Registered users" href="/admin/users" />
        <Stat label="Administrators" value={stats.users.staff} hint="Accounts with staff access" href="/admin/users" />
        <Stat
          label="Active accounts"
          value={stats.users.active}
          hint={`${stats.users.staff} with admin access`}
          href="/admin/users"
        />
        <Stat
          label="Unverified emails"
          value={stats.users.unverified}
          hint="Awaiting email confirmation"
          href="/admin/users"
        />
      </div>


    </div>
  )
}

// ----------------------------------------------------------------------------

function Stat({
  label,
  value,
  hint,
  href,
  emphasis = false,
}: {
  label: string
  value: number
  hint: string
  href?: string
  emphasis?: boolean
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${
          emphasis ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
    </>
  )

  const className =
    "rounded-xl border border-gray-200 bg-white p-5 transition-all"

  if (!href) return <div className={className}>{body}</div>

  return (
    <Link href={href} className={`${className} hover:border-gray-900 hover:shadow-sm`}>
      {body}
    </Link>
  )
}
