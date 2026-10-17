"use client"

import { useState } from "react"

import { QRCodeSVG } from "qrcode.react"
import { ShieldCheck, ShieldOff } from "lucide-react"

import { useMfaStatus } from "@/hooks/queries/use-mfa-status"
import {
  confirmMfaEnrolment,
  disableMfa,
  regenerateRecoveryCodes,
  startMfaEnrolment,
} from "@/lib/api/auth/mfa"
import { apiErrorMessage, ErrorCode, hasErrorCode } from "@/lib/api/errors"
import { queryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"

import type { MfaEnrolment } from "@/types/security"

import RecoveryCodesPanel from "./recovery-codes-panel"

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"

const primaryButton =
  "rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"

const secondaryButton =
  "rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"

/** Below this many unused codes, nudge the person to issue a fresh set. */
const LOW_RECOVERY_CODES = 3

type Mode = "idle" | "enrolling" | "regenerate" | "disable" | "codes"

/** The base32 secret in groups of four, easier to type into an app by hand. */
function formatSecret(secret: string) {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret
}

function CodeField({
  id,
  label,
  value,
  onChange,
  disabled,
  allowRecovery = false,
  autoFocus = true,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  allowRecovery?: boolean
  autoFocus?: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        id={id}
        required
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="one-time-code"
        inputMode={allowRecovery ? "text" : "numeric"}
        maxLength={allowRecovery ? 32 : 7}
        placeholder={allowRecovery ? "123456 or recovery code" : "123456"}
        className={`${inputClass} font-mono tracking-widest`}
      />
    </div>
  )
}

export default function TwoFactorCard() {
  const { data: status, isLoading, isError } = useMfaStatus()

  const [mode, setMode] = useState<Mode>("idle")
  const [enrolment, setEnrolment] = useState<MfaEnrolment | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  function reset(next: Mode = "idle") {
    setMode(next)
    setCode("")
    setPassword("")
    setError("")
    setNotice("")
    if (next !== "enrolling") setEnrolment(null)
  }

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true)
    setError("")
    setNotice("")

    try {
      await action()
    } catch (caught) {
      // A rejected code is spent or wrong either way; clear it so the next
      // attempt starts from an empty field instead of an edit of the old one.
      if (hasErrorCode(caught, ErrorCode.InvalidOtp)) setCode("")

      setError(apiErrorMessage(caught, fallback))
    } finally {
      setBusy(false)
    }
  }

  function showCodes(codes: string[]) {
    setRecoveryCodes(codes)
    reset("codes")
    queryClient.invalidateQueries({ queryKey: queryKeys.mfaStatus() })
  }

  function handleStart() {
    void run(async () => {
      setEnrolment(await startMfaEnrolment())
      reset("enrolling")
    }, "Unable to start two-factor setup.")
  }

  function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    void run(async () => {
      showCodes(await confirmMfaEnrolment(code))
    }, "That code could not be verified.")
  }

  function handleRegenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    void run(async () => {
      showCodes(await regenerateRecoveryCodes(code))
    }, "Unable to regenerate recovery codes.")
  }

  function handleDisable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    void run(async () => {
      await disableMfa({ password, code })
      reset()
      setNotice("Two-factor authentication has been turned off.")
      await queryClient.invalidateQueries({ queryKey: queryKeys.mfaStatus() })
    }, "Unable to turn off two-factor authentication.")
  }

  function handleDone() {
    setRecoveryCodes([])
    reset()
  }

  const enabled = status?.enabled ?? false

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-3">
            {enabled ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <ShieldOff className="h-6 w-6" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Two-factor Authentication
            </h2>

            <p className="text-sm text-gray-500">
              Require a code from an authenticator app when you sign in.
            </p>
          </div>
        </div>

        {status && (
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-medium",
              enabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600",
            ].join(" ")}
          >
            {enabled ? "On" : "Off"}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load two-factor status.
        </div>
      )}

      {status && (
        <div className="space-y-6">
          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}

          {/* Recovery codes, shown once after enrolment or regeneration */}

          {mode === "codes" && (
            <RecoveryCodesPanel codes={recoveryCodes} onDone={handleDone} />
          )}

          {/* Not enrolled */}

          {!enabled && mode === "idle" && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Protect your account with a second step at sign-in, using an
                app such as Google Authenticator, 1Password or Authy.
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={handleStart}
                className={`${primaryButton} shrink-0`}
              >
                {busy ? "Starting..." : "Set up"}
              </button>
            </div>
          )}

          {/* Enrolment: scan, then prove it with a code */}

          {mode === "enrolling" && enrolment && (
            <form onSubmit={handleConfirm} className="space-y-6">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
                <li>Scan the QR code with your authenticator app.</li>
                <li>Enter the six-digit code the app shows.</li>
              </ol>

              <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-200 p-6 sm:flex-row sm:items-start">
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                  <QRCodeSVG
                    value={enrolment.provisioning_uri}
                    size={176}
                    marginSize={0}
                    title="Authenticator setup QR code"
                  />
                </div>

                <div className="min-w-0 space-y-2 text-sm">
                  <p className="text-gray-600">
                    Can&apos;t scan it? Enter this key in your app instead:
                  </p>

                  <code className="block break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-gray-900">
                    {formatSecret(enrolment.secret)}
                  </code>
                </div>
              </div>

              <CodeField
                id="mfa-confirm-code"
                label="Verification code"
                value={code}
                onChange={setCode}
                disabled={busy}
              />

              {error && <ErrorMessage message={error} />}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reset()}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button type="submit" disabled={busy} className={primaryButton}>
                  {busy ? "Verifying..." : "Turn on"}
                </button>
              </div>
            </form>
          )}

          {/* Enrolled */}

          {enabled && mode === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You have{" "}
                <strong className="text-gray-900">
                  {status.recovery_codes_remaining}
                </strong>{" "}
                unused recovery{" "}
                {status.recovery_codes_remaining === 1 ? "code" : "codes"}.
              </p>

              {status.recovery_codes_remaining <= LOW_RECOVERY_CODES && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You are running low on recovery codes. Generate a new set so
                  you are not locked out if you lose your device.
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => reset("regenerate")}
                  className={secondaryButton}
                >
                  New recovery codes
                </button>

                <button
                  type="button"
                  onClick={() => reset("disable")}
                  className="rounded-xl border border-red-200 px-6 py-3 font-medium text-red-600 transition hover:border-red-600 hover:bg-red-50"
                >
                  Turn off
                </button>
              </div>
            </div>
          )}

          {mode === "regenerate" && (
            <form onSubmit={handleRegenerate} className="space-y-6">
              <p className="text-sm text-gray-600">
                Your current recovery codes stop working as soon as new ones
                are issued.
              </p>

              <CodeField
                id="mfa-regenerate-code"
                label="Authentication or recovery code"
                value={code}
                onChange={setCode}
                disabled={busy}
                allowRecovery
              />

              {error && <ErrorMessage message={error} />}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reset()}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button type="submit" disabled={busy} className={primaryButton}>
                  {busy ? "Generating..." : "Generate codes"}
                </button>
              </div>
            </form>
          )}

          {mode === "disable" && (
            <form onSubmit={handleDisable} className="space-y-6">
              <p className="text-sm text-gray-600">
                Confirm with your password and a current code. Your recovery
                codes will be deleted.
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="mfa-disable-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Current password
                </label>

                <input
                  id="mfa-disable-password"
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

              <CodeField
                id="mfa-disable-code"
                label="Authentication or recovery code"
                value={code}
                onChange={setCode}
                disabled={busy}
                allowRecovery
                autoFocus={false}
              />

              {error && <ErrorMessage message={error} />}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reset()}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Turning off..." : "Turn off"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {message}
    </div>
  )
}
