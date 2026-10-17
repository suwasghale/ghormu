"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import MfaChallengeForm, {
  type MfaChallenge,
} from "@/components/auth/mfa-challenge-form"
import {
  completeSocialSignIn,
  takeSocialReturnPath,
} from "@/lib/api/auth/social"
import { apiErrorMessage } from "@/lib/api/errors"
import { postLoginPath } from "@/lib/auth/redirect"
import { useAuthStore } from "@/store/auth-store"
import type { LoginResponse } from "@/types/auth"

type SocialCallbackProps = {
  provider: string
  code: string | null
  state: string | null
  /** Set by the provider when the person declined or something failed there. */
  providerError: string | null
}

type Status =
  | { kind: "working" }
  | { kind: "mfa"; challenge: MfaChallenge }
  | { kind: "failed"; message: string }

const FAILED = "Sign-in with the provider failed. Please try again."

function initialStatus({
  code,
  state,
  providerError,
}: SocialCallbackProps): Status {
  if (providerError === "access_denied") {
    return { kind: "failed", message: "Sign-in was cancelled." }
  }

  if (providerError || !code || !state) {
    return { kind: "failed", message: FAILED }
  }

  return { kind: "working" }
}

export default function SocialCallback(props: SocialCallbackProps) {
  const { provider, code, state } = props

  const router = useRouter()
  const loginStore = useAuthStore((store) => store.login)

  const [status, setStatus] = useState<Status>(() => initialStatus(props))

  // The authorization code is single-use. React's development double-run
  // of effects would otherwise spend it on the first call and fail the
  // second, so the exchange is guarded to happen exactly once.
  const started = useRef(false)

  function complete(session: LoginResponse["data"]) {
    loginStore(session.user)
    router.replace(postLoginPath(session.user, takeSocialReturnPath()))
  }

  useEffect(() => {
    if (status.kind !== "working" || started.current || !code || !state) {
      return
    }

    started.current = true

    // Drop the code from the address bar and history straight away.
    window.history.replaceState(null, "", window.location.pathname)

    completeSocialSignIn(provider, { code, state })
      .then((result) => {
        if (result.kind === "authenticated") {
          complete(result.session)
          return
        }

        setStatus({
          kind: "mfa",
          challenge: {
            ticket: result.ticket,
            expiresAt: Date.now() + result.expiresIn * 1000,
          },
        })
      })
      .catch((caught) => {
        setStatus({ kind: "failed", message: apiErrorMessage(caught, FAILED) })
      })
    // `complete` only closes over stable values, and the exchange must
    // never re-run once started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.kind, provider, code, state])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      {status.kind === "working" && (
        <div
          role="status"
          className="flex flex-col items-center gap-3 text-sm text-gray-600"
        >
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          Signing you in…
        </div>
      )}

      {status.kind === "mfa" && (
        <MfaChallengeForm
          challenge={status.challenge}
          onAuthenticated={complete}
          onRestart={(message) =>
            setStatus({
              kind: "failed",
              message: message ?? "Sign-in was cancelled.",
            })
          }
          restartLabel="Cancel sign-in"
        />
      )}

      {status.kind === "failed" && (
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Could not sign you in
          </h1>

          <p role="alert" className="text-sm text-gray-600">
            {status.message}
          </p>

          <Link
            href="/login"
            className="inline-block w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-900"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </main>
  )
}
