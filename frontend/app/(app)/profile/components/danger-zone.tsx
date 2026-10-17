"use client"

import { useState } from "react"

import {
  AlertTriangle,
  LogOut,
  Trash2,
} from "lucide-react"

import DeleteAccountDialog from "./delete-account-dialog"

type DangerZoneProps = {
  onLogout: () => void
}

export default function DangerZone({
  onLogout,
}: DangerZoneProps) {
  const [deleting, setDeleting] = useState(false)

  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-xl bg-red-100 p-3 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-red-700">
            Danger Zone
          </h2>

          <p className="mt-1 text-sm text-red-600">
            These actions may affect your account permanently.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Logout */}

        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-white p-5">
          <div>
            <h3 className="font-semibold text-gray-900">
              Sign out
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              End your current authenticated session.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Delete account */}

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-white p-5">
          <div>
            <h3 className="font-semibold text-gray-900">
              Delete account
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Deactivate your account and sign out of every device.
            </p>
          </div>

          <button
            onClick={() => setDeleting(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-600 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <DeleteAccountDialog
        open={deleting}
        onClose={() => setDeleting(false)}
      />
    </section>
  )
}