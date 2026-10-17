import type { Metadata } from 'next'
import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page not found — 404',
}

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white">
          <FileQuestion aria-hidden="true" size={28} className="text-gray-700" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
          Error 404
        </p>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-950">
          Page not found
        </h1>

        <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-gray-600">
          The page you are looking for may have moved or no longer exists.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-900"
          >
            Back to home
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
