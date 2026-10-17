"use client"

// ============================================================================
// "Continue with …" buttons
// ============================================================================
//
// Renders nothing until the API says a provider is configured, so a
// project without OAuth credentials shows a plain password form and no
// dead buttons.
// ============================================================================

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { getSocialProviders, startSocialSignIn } from "@/lib/api/auth/social"
import { apiErrorMessage } from "@/lib/api/errors"
import { queryKeys } from "@/lib/query/keys"

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
  apple: "Apple",
}

function providerLabel(provider: string) {
  return (
    PROVIDER_LABELS[provider] ??
    provider.charAt(0).toUpperCase() + provider.slice(1)
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  )
}

type SocialSignInProps = {
  /** Shown between the provider buttons and the form that follows. */
  dividerLabel?: string
}

export default function SocialSignIn({
  dividerLabel = "or continue with email",
}: SocialSignInProps) {
  const { data: providers = [] } = useQuery({
    queryKey: queryKeys.socialProviders(),
    queryFn: getSocialProviders,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (providers.length === 0) return null

  async function handleClick(provider: string) {
    setPending(provider)
    setError("")

    try {
      const next = new URLSearchParams(window.location.search).get("next")

      // On success the browser is already navigating to the provider.
      await startSocialSignIn(provider, next)
    } catch (caught) {
      setError(
        apiErrorMessage(caught, "Unable to start sign-in. Please try again."),
      )
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={pending !== null}
          onClick={() => handleClick(provider)}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-900 transition hover:border-black disabled:opacity-60"
        >
          {pending === provider ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : provider === "google" ? (
            <GoogleMark />
          ) : null}
          Continue with {providerLabel(provider)}
        </button>
      ))}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        {dividerLabel}
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  )
}
