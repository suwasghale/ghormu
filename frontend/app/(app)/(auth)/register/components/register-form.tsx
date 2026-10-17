"use client"

// ============================================================================
// Register Form
// ============================================================================

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import SocialSignIn from "@/components/auth/social-sign-in"
import { site } from "@/config/site"
import { register } from "@/lib/api/auth/register"
import { ApiError } from "@/lib/api/client"

import { PasswordField } from "./password-field"
import { PasswordStrength } from "./password-strength"
import { PasswordRules } from "./password-rules"
import { FormAlert } from "./form-alert"

import { usePasswordStrength } from "../hooks/use-password-strength"

interface RegisterFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
}

const INITIAL_FORM: RegisterFormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirm: "",
}

export function RegisterForm() {
  const router = useRouter()

  // ============================================================
  // State
  // ============================================================

  const [form, setForm] =
    useState<RegisterFormData>(INITIAL_FORM)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  // ============================================================
  // Password Hook
  // ============================================================

  const {
    strength,
    requirements,
    canSubmit,
  } = usePasswordStrength(form.password, form.password_confirm)

  // ============================================================
  // Derived Values
  // ============================================================

  const passwordsMatch =
    form.password_confirm.length > 0 &&
    form.password ===
      form.password_confirm

  const showMismatch =
    form.password_confirm.length > 0 &&
    !passwordsMatch

  const showStrength =
    form.password.length > 0

  const formCanSubmit =
    canSubmit && passwordsMatch

  // ============================================================
  // Handlers
  // ============================================================

  function updateField(
    key: keyof RegisterFormData,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))

    if (error) {
      setError("")
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response =
        await register(form)

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
            "Registration failed.",
        )
      } else {
        setError(
          "Registration failed.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // JSX
  // ============================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Create Account
        </h1>

        <p className="text-sm text-gray-500">
          Join {site.name} today
        </p>
      </div>

      <SocialSignIn dividerLabel="or sign up with email" />

      {/* ====================================================== */}
      {/* Alerts */}
      {/* ====================================================== */}

      <FormAlert
        variant="error"
        message={error}
      />

      <FormAlert
        variant="success"
        message={success}
      />

      {/* ====================================================== */}
      {/* Name */}
      {/* ====================================================== */}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            First Name
          </label>

          <input
            id="first_name"
            type="text"
            autoComplete="given-name"
            required
            value={form.first_name}
            onChange={(event) =>
              updateField(
                "first_name",
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div>
          <label
            htmlFor="last_name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>

          <input
            id="last_name"
            type="text"
            autoComplete="family-name"
            required
            value={form.last_name}
            onChange={(event) =>
              updateField(
                "last_name",
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* Email */}
      {/* ====================================================== */}

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
          value={form.email}
          onChange={(event) =>
            updateField(
              "email",
              event.target.value,
            )
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
      </div>

            {/* ====================================================== */}
      {/* Password */}
      {/* ====================================================== */}

      <PasswordField
        id="password"
        label="Password"
        value={form.password}
        onChange={(value) =>
          updateField("password", value)
        }
        autoComplete="new-password"
        required
      />

      {/* ====================================================== */}
      {/* Password Strength */}
      {/* ====================================================== */}

      <PasswordStrength
        strength={strength}
        visible={showStrength}
      />

      {/* ====================================================== */}
      {/* Password Rules */}
      {/* ====================================================== */}

      <PasswordRules
        requirements={requirements}
        visible={showStrength}
      />

      {/* ====================================================== */}
      {/* Confirm Password */}
      {/* ====================================================== */}

      <PasswordField
        id="password_confirm"
        label="Confirm Password"
        value={form.password_confirm}
        onChange={(value) =>
          updateField(
            "password_confirm",
            value,
          )
        }
        autoComplete="new-password"
        required
        error={showMismatch}
      />

      {/* ====================================================== */}
      {/* Password Match Alert */}
      {/* ====================================================== */}

      {showMismatch && (
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

      {/* ====================================================== */}
      {/* Submit */}
      {/* ====================================================== */}

      <button
        type="submit"
        disabled={
          loading || !formCanSubmit
        }
        className="
          w-full
          rounded-lg
          bg-black
          py-3

          font-medium
          text-white

          transition-colors

          hover:bg-gray-900

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {loading
          ? "Creating account..."
          : "Create Account"}
      </button>

      {/* ====================================================== */}
      {/* Footer */}
      {/* ====================================================== */}

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}

        <Link
          href="/login"
          className="
            font-semibold
            text-black

            transition-colors

            hover:underline
          "
        >
          Sign In
        </Link>
      </p>
    </form>
  )
}