import Link from "next/link"

import {
  CheckCircle2,
  Layers,
} from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">

      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

        {/* ====================================== */}
        {/* Icon */}
        {/* ====================================== */}

        <div className="flex justify-center">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">

            <CheckCircle2
              size={42}
              className="text-green-600"
            />

          </div>

        </div>

        {/* ====================================== */}
        {/* Heading */}
        {/* ====================================== */}

        <div className="mt-6 text-center">

          <h1 className="text-3xl font-bold">
            Your next project starts here
          </h1>

          <p className="mt-3 text-gray-500">
            A complete account and administration foundation.
          </p>

        </div>

        {/* ====================================== */}
        {/* Email Card */}
        {/* ====================================== */}

        <div className="mt-8 rounded-xl border bg-gray-50 p-5">

          <div className="flex items-start gap-4">

            <Layers
              size={22}
              className="mt-1 text-blue-600"
            />

            <div>

              <p className="font-medium">
                Built to reuse
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Next.js, Django, PostgreSQL, Redis and Celery.
              </p>

              <p className="mt-2 break-all font-semibold">
                Secure accounts. Reusable administration.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================== */}
        {/* Instructions */}
        {/* ====================================== */}

        <div className="mt-6 space-y-2 text-sm text-gray-600">

          <p>
            • Registration, email verification and account security.
          </p>

          <p>
            • User management, responsive navigation and uploads.
          </p>

          <p>
            • Docker, automated checks and backup tooling.
          </p>

        </div>

        {/* ====================================== */}
        {/* Actions */}
        {/* ====================================== */}

        <div className="mt-8 space-y-3">

          <Link
            href="/register"
            className="block w-full rounded-lg border border-gray-300 py-3 text-center font-medium transition hover:bg-gray-100"
          >
            Create an account
          </Link>

          <Link
            href="/login"
            className="block w-full rounded-lg bg-black py-3 text-center font-medium text-white transition hover:bg-gray-900"
          >
            Sign in
          </Link>

        </div>

      </div>

    </main>
  )
}