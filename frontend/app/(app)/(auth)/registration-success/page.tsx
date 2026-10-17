import Link from "next/link"

import {
  CheckCircle2,
  Mail,
} from "lucide-react"

interface Props {
  searchParams: Promise<{
    email?: string
  }>
}

export default async function RegistrationSuccessPage({
  searchParams,
}: Props) {
  const { email } = await searchParams

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
            Registration Successful
          </h1>

          <p className="mt-3 text-gray-500">
            Your account has been created.
          </p>

        </div>

        {/* ====================================== */}
        {/* Email Card */}
        {/* ====================================== */}

        <div className="mt-8 rounded-xl border bg-gray-50 p-5">

          <div className="flex items-start gap-4">

            <Mail
              size={22}
              className="mt-1 text-blue-600"
            />

            <div>

              <p className="font-medium">
                Verification Email Sent
              </p>

              <p className="mt-1 text-sm text-gray-500">
                We have sent a verification
                email to
              </p>

              <p className="mt-2 break-all font-semibold">
                {email ?? "your email"}
              </p>

            </div>

          </div>

        </div>

        {/* ====================================== */}
        {/* Instructions */}
        {/* ====================================== */}

        <div className="mt-6 space-y-2 text-sm text-gray-600">

          <p>
            • Open your inbox.
          </p>

          <p>
            • Click the verification link.
          </p>

          <p>
            • After verifying, you will be able
            to log in.
          </p>

        </div>

        {/* ====================================== */}
        {/* Actions */}
        {/* ====================================== */}

        <div className="mt-8 space-y-3">

          <Link
            href={`/resend-verification?email=${encodeURIComponent(
              email ?? "",
            )}`}
            className="block w-full rounded-lg border border-gray-300 py-3 text-center font-medium transition hover:bg-gray-100"
          >
            Resend Verification Email
          </Link>

          <Link
            href="/login"
            className="block w-full rounded-lg bg-black py-3 text-center font-medium text-white transition hover:bg-gray-900"
          >
            Back to Login
          </Link>

        </div>

      </div>

    </main>
  )
}