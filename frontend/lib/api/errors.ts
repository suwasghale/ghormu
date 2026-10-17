// ============================================================================
// Reading errors the API sends back
// ============================================================================
//
// Every failed request arrives as an `ApiError` carrying the server's
// envelope: `{ success: false, message, errors: { field: [...] } }`. Two
// things are wanted from it — a sentence to show, and a map of field
// errors to put next to inputs — and both were being re-derived by hand at
// each call site, several of them with `catch (err: any)` and an optional
// chain that TypeScript could not check.
//
// Shared here so a change to the envelope is one edit rather than a search.
// ============================================================================

import { ApiError } from "@/lib/api/client"

/** DRF field errors, flattened to one message per field. */
export type FieldErrors = Record<string, string>

/**
 * Error codes the UI reacts to, mirroring `default_code` on the backend
 * exceptions. Listed here so a typo is a type error rather than a branch
 * that silently never runs.
 */
export const ErrorCode = {
  InvalidOtp: "invalid_otp",
  MfaCodeRequired: "mfa_code_required",
  MfaChallengeInvalid: "mfa_challenge_invalid",
  InvalidPassword: "invalid_password",
  CurrentPasswordInvalid: "current_password_invalid",
  AccountLocked: "account_locked",
  SocialExchangeFailed: "social_exchange_failed",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/** The server's error code, or null for network failures and uncoded errors. */
export function apiErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

/** Whether `error` carries the given server error code. */
export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return apiErrorCode(error) === code
}

/**
 * A sentence worth showing the person who triggered the request.
 *
 * Prefers the server's own message — it is written for a reader and is
 * already in the right language — then the exception's message, then the
 * caller's fallback. Never returns an empty string.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const payload = error.data as { message?: string } | undefined

    if (payload?.message) return payload.message
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}

/**
 * Field errors, one message each.
 *
 * Forms show errors next to the input that caused them, so the shape they
 * need is `{ field: "message" }`, not DRF's arrays. A non-field error
 * lands under `__all__`.
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {}

  const payload = error.data as
    | { errors?: Record<string, unknown>; message?: string }
    | undefined

  const errors = payload?.errors

  if (!errors || typeof errors !== "object") {
    return payload?.message ? { __all__: payload.message } : {}
  }

  const flattened: FieldErrors = {}

  for (const [field, value] of Object.entries(errors)) {
    flattened[field] = Array.isArray(value) ? String(value[0]) : String(value)
  }

  return flattened
}
