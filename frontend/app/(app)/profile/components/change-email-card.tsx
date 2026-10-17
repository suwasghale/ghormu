"use client"

import { useState } from "react"

import {
  Mail,
  Send,
} from "lucide-react"

import { changeEmailRequest } from "@/lib/api/auth/change-email-request"
import { apiErrorMessage } from "@/lib/api/errors"

export default function ChangeEmailCard() {
  const [email, setEmail] = useState("")

  const [loading, setLoading] = useState(false)

  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSuccess("")
    setError("")

    setLoading(true)

    try {
      const response = await changeEmailRequest({
        new_email: email,
      })

      setSuccess(response.message)

      setEmail("")
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to send verification email."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-gray-100 p-3">
          <Mail className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Change Email
          </h2>

          <p className="text-sm text-gray-500">
            Update the email address associated with your account.
          </p>
        </div>

      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">

        <h3 className="font-medium text-blue-900">
          Verification required
        </h3>

        <p className="mt-2 text-sm leading-6 text-blue-700">
          We will send a verification email to your new email address.
          Your current email will remain active until the new address
          is verified.
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        <div className="space-y-2">

          <label className="text-sm font-medium text-gray-700">
            New Email Address
          </label>

          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="name@example.com"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />

        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />

            {loading
              ? "Sending..."
              : "Send Verification"}
          </button>

        </div>

      </form>

    </section>
  )
}