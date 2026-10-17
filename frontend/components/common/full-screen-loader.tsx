"use client"

import { Loader2 } from "lucide-react"

type FullScreenLoaderProps = {
  title?: string
  description?: string
}

export default function FullScreenLoader({
  title = "Loading...",
  description = "Please wait while we prepare everything.",
}: FullScreenLoaderProps) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gray-50 px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

        <div className="mb-6 rounded-full bg-black/5 p-4">
          <Loader2
            className="h-8 w-8 animate-spin text-black"
            strokeWidth={2.5}
          />
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          {title}
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          {description}
        </p>

      </div>
    </main>
  )
}