"use client"

// ============================================================================
// Second-factor step of a sign-in
// ============================================================================
//
// Shared by the password login and the social sign-in callback: both can
// stop at "a code is required", and both finish the same way. The ticket
// stands for a credential that has already been accepted, so an expired or
// rejected ticket sends the person back to the start rather than letting
// them keep typing codes against it.
// ============================================================================

import { useState } from "react"

import { verifyMFA } from "@/lib/api/auth/login"
import { ApiError } from "@/lib/api/client"
import { ErrorCode, hasErrorCode } from "@/lib/api/errors"
import type { LoginResponse } from "@/types/auth"

export type MfaChallenge = {
  ticket: string
  /** Epoch milliseconds after which the ticket is no longer accepted. */
  expiresAt: number
}

type MfaChallengeFormProps = {
  challenge: MfaChallenge
  onAuthenticated: (session: LoginResponse["data"]) => void
  /** Abandon the challenge, with the reason to show on the first step. */
  onRestart: (message?: string) => void
  restartLabel?: string
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10"

const EXPIRED_MESSAGE = "Your verification session expired. Please sign in again."

export default function MfaChallengeForm({
  challenge,
  onAuthenticated,
  onRestart,
  restartLabel = "Use a different account or restart sign-in",
}: MfaChallengeFormProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    if (Date.now() >= challenge.expiresAt) {
      onRestart(EXPIRED_MESSAGE)
      return
    }

    setLoading(true)
    setError("")

    try {
      onAuthenticated(await verifyMFA(challenge.ticket, code))
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? (caught.data as { message?: string } | null)?.message ??
            "The code could not be verified. Try again or use a recovery code."
          : "Unable to connect. Please check your connection and try again."

      if (hasErrorCode(caught, ErrorCode.MfaChallengeInvalid)) {
        onRestart(message)
        return
      }

      if (hasErrorCode(caught, ErrorCode.InvalidOtp)) setCode("")

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={loading}
      className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">
          Verify your sign-in
        </h1>
        <p className="text-sm text-gray-600">
          Enter a code from your authenticator app or a recovery code.
        </p>
      </div>

      <div>
        <label
          htmlFor="mfa-challenge-code"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Authentication or recovery code
        </label>
        <input
          id="mfa-challenge-code"
          autoFocus
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          maxLength={32}
          required
          aria-describedby={error ? "mfa-challenge-error" : undefined}
          className={inputClass}
        />
      </div>

      {error && (
        <div
          id="mfa-challenge-error"
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-900 disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Verify code"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => onRestart()}
        className="w-full text-sm font-medium text-gray-700 underline"
      >
        {restartLabel}
      </button>
    </form>
  )
}
