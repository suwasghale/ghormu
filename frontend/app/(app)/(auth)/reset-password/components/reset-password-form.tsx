"use client"

// ============================================================================
// Reset Password Form
// ============================================================================

import { useMemo, useState } from "react"

import Link from "next/link"

import { useRouter, useSearchParams } from "next/navigation"

import { ApiError } from "@/lib/api/client"
import { resetPassword } from "@/lib/api/auth/reset-password"

import { PasswordField } from "@/app/(app)/(auth)/register/components/password-field"
import { PasswordStrength } from "@/app/(app)/(auth)/register/components/password-strength"
import { PasswordRules } from "@/app/(app)/(auth)/register/components/password-rules"
import { FormAlert } from "@/app/(app)/(auth)/register/components/form-alert"

import { usePasswordStrength } from "@/app/(app)/(auth)/register/hooks/use-password-strength"

export function ResetPasswordForm() {
  const router = useRouter()

  const params = useSearchParams()

  const token = params.get("token") ?? ""

  const [password, setPassword] =
    useState("")

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState("")

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const {
    strength,
    requirements,
    canSubmit,
  } = usePasswordStrength(password, passwordConfirm)

  const passwordsMatch = useMemo(
    () =>
      passwordConfirm.length > 0 &&
      password === passwordConfirm,
    [password, passwordConfirm],
  )

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!token) {
      setError("Invalid reset link.")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response =
        await resetPassword({
          token,
          password,
          password_confirm:
            passwordConfirm,
        })

      setSuccess(response.message)

      setTimeout(() => {
        router.replace("/login")
      }, 2000)
    } catch (error) {
      if (error instanceof ApiError) {
        setError(
          (error.data as {
            message?: string
          })?.message ??
            "Unable to reset password.",
        )
      } else {
        setError(
          "Unable to reset password.",
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
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Reset Password
        </h1>

        <p className="text-sm text-gray-500">
          Choose a new password.
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

      <PasswordField
        id="password"
        label="New Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
      />

      <PasswordStrength
        strength={strength}
        visible={password.length > 0}
      />

      <PasswordRules
        requirements={requirements}
        visible={password.length > 0}
      />

      <PasswordField
        id="password_confirm"
        label="Confirm Password"
        value={passwordConfirm}
        onChange={setPasswordConfirm}
        autoComplete="new-password"
        required
        error={
          passwordConfirm.length > 0 &&
          !passwordsMatch
        }
      />

      {passwordConfirm.length > 0 &&
        !passwordsMatch && (
          <FormAlert
            variant="warning"
            message="Passwords do not match."
          />
        )}

      {passwordsMatch && (
        <FormAlert
          variant="success"
          message="Passwords match."
        />
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !canSubmit ||
          !passwordsMatch
        }
        className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Updating..."
          : "Reset Password"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Remembered your password?{" "}
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