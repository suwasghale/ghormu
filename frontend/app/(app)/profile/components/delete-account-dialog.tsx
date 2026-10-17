"use client"

// ============================================================================
// Delete account dialog
// ============================================================================
//
// Asks for the current password, plus a two-factor or recovery code when
// the account has a second factor. Focus starts in the password field
// rather than on the delete button, so a stray Enter cannot confirm
// anything on its own.
// ============================================================================

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AlertTriangle, Loader2 } from "lucide-react"

import { useMfaStatus } from "@/hooks/queries/use-mfa-status"
import { deleteAccount } from "@/lib/api/auth/delete-account"
import { apiErrorMessage, ErrorCode, hasErrorCode } from "@/lib/api/errors"
import { logout } from "@/lib/auth/logout"

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"

type DeleteAccountDialogProps = {
  open: boolean
  onClose: () => void
}

export default function DeleteAccountDialog({
  open,
  onClose,
}: DeleteAccountDialogProps) {
  const router = useRouter()
  const { data: mfa } = useMfaStatus()

  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // The status query decides up front; the server's `mfa_code_required`
  // answer covers a status that is stale or failed to load.
  const [codeDemanded, setCodeDemanded] = useState(false)
  const needsCode = Boolean(mfa?.enabled) || codeDemanded

  function reset() {
    setPassword("")
    setCode("")
    setError("")
  }

  function handleClose() {
    if (busy) return

    reset()
    onClose()
  }

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setPassword("")
        setCode("")
        setError("")
        onClose()
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, busy, onClose])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setBusy(true)
    setError("")

    try {
      const response = await deleteAccount({
        password,
        code: needsCode ? code : undefined,
      })

      // The server has already revoked every session; this clears the
      // cookies on this device and the cached account data.
      await logout()

      toast.success(response.message)
      router.replace("/login")
    } catch (caught) {
      if (hasErrorCode(caught, ErrorCode.MfaCodeRequired)) {
        setCodeDemanded(true)
      }

      if (hasErrorCode(caught, ErrorCode.InvalidOtp)) {
        setCode("")
      }

      setError(apiErrorMessage(caught, "Unable to delete your account."))
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-body"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="delete-account-title"
              className="text-lg font-bold text-gray-900"
            >
              Delete account
            </h2>

            <p id="delete-account-body" className="mt-1 text-sm text-gray-600">
              Your account will be deactivated and you will be signed out on
              every device. You will not be able to sign in again with this
              account.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="delete-account-password"
            className="text-sm font-medium text-gray-700"
          >
            Confirm with your password
          </label>

          <input
            id="delete-account-password"
            type="password"
            required
            autoFocus
            disabled={busy}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        {needsCode && (
          <div className="space-y-2">
            <label
              htmlFor="delete-account-code"
              className="text-sm font-medium text-gray-700"
            >
              Authentication or recovery code
            </label>

            <input
              id="delete-account-code"
              required
              disabled={busy}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              maxLength={32}
              placeholder="123456 or recovery code"
              className={`${inputClass} font-mono tracking-widest`}
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy || !password || (needsCode && !code.trim())}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Deleting..." : "Delete my account"}
          </button>
        </div>
      </form>
    </div>
  )
}
