'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { site } from '@/config/site'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(`[${site.name}]`, error)
  }, [error])

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
          <AlertCircle aria-hidden="true" size={28} className="text-red-600" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-red-700">
          Unexpected error
        </p>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-950">
          Something went wrong
        </h1>

        <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-gray-600">
          An error occurred while loading this page. You can try again or go
          back to the home page.
        </p>

        {error.digest && (
          <p className="mb-7 font-mono text-xs text-gray-500">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-900"
          >
            Try again
          </button>

          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
