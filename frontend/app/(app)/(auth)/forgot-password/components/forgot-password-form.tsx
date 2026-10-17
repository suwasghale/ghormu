"use client"

// ============================================================================
// Forgot Password Form
// ============================================================================

import { useState } from "react"
import Link from "next/link"

import { forgotPassword } from "@/lib/api/auth/forgot-password"
import { ApiError } from "@/lib/api/client"

import { FormAlert } from "@/app/(app)/(auth)/register/components/form-alert"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
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
        await forgotPassword({
          email,
        })

      setSuccess(response.message)

      setEmail("")
    } catch (error) {
      if (error instanceof ApiError) {
        setError(
          (error.data as {
            message?: string
          })?.message ??
            "Unable to send reset email.",
        )
      } else {
        setError(
          "Unable to send reset email.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      {/* ====================================== */}
      {/* Header */}
      {/* ====================================== */}

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500">
          Enter your email address and
          we will send you a password reset
          link.
        </p>
      </div>

      <FormAlert
        variant="error"
        message={error}
      />

      <FormAlert
        variant="success"
        message={success}
      />

      {/* ====================================== */}
      {/* Email */}
      {/* ====================================== */}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* ====================================== */}
      {/* Submit */}
      {/* ====================================== */}

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          rounded-lg
          bg-black
          py-3
          font-medium
          text-white
          transition
          hover:bg-gray-900
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {loading
          ? "Sending..."
          : "Send Reset Link"}
      </button>

      {/* ====================================== */}
      {/* Footer */}
      {/* ====================================== */}

      <p className="text-center text-sm text-gray-600">
        Remember your password?{" "}

        <Link
          href="/login"
          className="font-semibold text-black hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </form>
  )
}