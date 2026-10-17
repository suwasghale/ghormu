"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import { useSearchParams } from "next/navigation"

import {
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"

import { ApiError } from "@/lib/api/client"

import { verifyEmail } from "@/lib/api/auth/verify-email"

export function VerifyEmailCard() {
  const searchParams = useSearchParams()

  const token =
    searchParams.get("token") ?? ""

  const [loading, setLoading] =
    useState(true)

  const [success, setSuccess] =
    useState(false)

  const [message, setMessage] =
    useState("")

  useEffect(() => {
    async function verify() {
      if (!token) {
        setLoading(false)
        setSuccess(false)
        setMessage(
          "Verification token is missing.",
        )
        return
      }

      try {
        const response =
          await verifyEmail({
            token,
          })

        setSuccess(true)
        setMessage(response.message)
      } catch (error) {
        if (error instanceof ApiError) {
          setMessage(
            (error.data as {
              message?: string
            })?.message ??
              "Verification failed.",
          )
        } else {
          setMessage(
            "Verification failed.",
          )
        }

        setSuccess(false)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [token])

  return (
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

      {/* Loading */}

      {loading && (
        <div className="space-y-6 text-center">

          <Loader2
            size={50}
            className="mx-auto animate-spin text-blue-600"
          />

          <div>

            <h1 className="text-3xl font-bold">
              Verifying Email
            </h1>

            <p className="mt-2 text-gray-500">
              Please wait...
            </p>

          </div>

        </div>
      )}

      {/* Success */}

      {!loading && success && (
        <div className="space-y-6 text-center">

          <CheckCircle2
            size={60}
            className="mx-auto text-green-600"
          />

          <div>

            <h1 className="text-3xl font-bold">
              Email Verified
            </h1>

            <p className="mt-3 text-gray-500">
              {message}
            </p>

          </div>

          <Link
            href="/login"
            className="block rounded-lg bg-black py-3 font-medium text-white transition hover:bg-gray-900"
          >
            Continue to Login
          </Link>

        </div>
      )}

      {/* Failed */}

      {!loading && !success && (
        <div className="space-y-6 text-center">

          <XCircle
            size={60}
            className="mx-auto text-red-600"
          />

          <div>

            <h1 className="text-3xl font-bold">
              Verification Failed
            </h1>

            <p className="mt-3 text-gray-500">
              {message}
            </p>

          </div>

          <Link
            href="/resend-verification"
            className="block rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-100"
          >
            Resend Verification Email
          </Link>

        </div>
      )}

    </div>
  )
}