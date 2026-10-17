"use client"

import { useState } from "react"

import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react"

import { changePassword } from "@/lib/api/auth/change-password"
import { apiErrorMessage } from "@/lib/api/errors"

type PasswordInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  autoComplete: string
  disabled: boolean
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled,
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          required
          minLength={8}
          disabled={disabled}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)

  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      setSuccess(response.message)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setError(apiErrorMessage(error, "Unable to change password."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3">
          <LockKeyhole className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Change Password
          </h2>

          <p className="text-sm text-gray-500">
            Update your account password to keep your account secure.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="space-y-2">
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew(!showNew)}
            autoComplete="new-password"
            disabled={loading}
          />

          <p className="text-xs text-gray-500">
            Use at least 8 characters including uppercase, lowercase,
            a number and a special character.
          </p>
        </div>

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          autoComplete="new-password"
          disabled={loading}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  )
}