"use client"

import { useState } from "react"

import Link from "next/link"

import { useSearchParams } from "next/navigation"

import { Mail } from "lucide-react"

import { ApiError } from "@/lib/api/client"

import { resendVerificationEmail } from "@/lib/api/auth/resend-verification"

import { FormAlert } from "@/app/(app)/(auth)/register/components/form-alert"

export function ResendVerificationForm() {
  const searchParams = useSearchParams()

  const [email, setEmail] = useState(
    searchParams.get("email") ?? "",
  )

  const [loading, setLoading] =
    useState(false)

  const [success, setSuccess] =
    useState("")

  const [error, setError] =
    useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response =
        await resendVerificationEmail({
          email,
        })

      setSuccess(response.message)
    } catch (error) {
      if (error instanceof ApiError) {
        setError(
          (error.data as {
            message?: string
          })?.message ??
            "Unable to resend verification email.",
        )
      } else {
        setError(
          "Unable to resend verification email.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      {/* Header */}

      <div className="space-y-2 text-center">

        <div className="flex justify-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">

            <Mail
              size={32}
              className="text-blue-600"
            />

          </div>

        </div>

        <h1 className="text-3xl font-bold">
          Resend Verification Email
        </h1>

        <p className="text-sm text-gray-500">
          Enter your email address and
          we will send you a new
          verification link.
        </p>

      </div>

      <FormAlert
        variant="success"
        message={success}
      />

      <FormAlert
        variant="error"
        message={error}
      />

      {/* Email */}

      <div>

        <label className="mb-2 block text-sm font-medium text-gray-700">
          Email
        </label>

        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
        />

      </div>

      {/* Button */}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Sending..."
          : "Send Verification Email"}
      </button>

      <p className="text-center text-sm text-gray-600">

        Remember your password?{" "}

        <Link
          href="/login"
          className="font-semibold hover:underline"
        >
          Login
        </Link>

      </p>

    </form>
  )
}