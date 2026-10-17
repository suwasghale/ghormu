// ============================================================================
// Two-factor Authentication API
// ============================================================================

import { apiClient } from "@/lib/api/client"

import type { MfaEnrolment, MfaStatus } from "@/types/security"

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

interface RecoveryCodes {
  codes: string[]
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const response = await apiClient.get<Envelope<MfaStatus>>("/auth/mfa/")

  return response.data
}

/** Issues a secret that does not protect the account until confirmed. */
export async function startMfaEnrolment(): Promise<MfaEnrolment> {
  const response = await apiClient.post<Envelope<MfaEnrolment>>(
    "/auth/mfa/enrol/",
    {},
  )

  return response.data
}

/** Activates the factor. The recovery codes are only ever returned here. */
export async function confirmMfaEnrolment(code: string): Promise<string[]> {
  const response = await apiClient.post<Envelope<RecoveryCodes>>(
    "/auth/mfa/confirm/",
    { code: code.trim() },
  )

  return response.data.codes
}

export async function regenerateRecoveryCodes(code: string): Promise<string[]> {
  const response = await apiClient.post<Envelope<RecoveryCodes>>(
    "/auth/mfa/recovery-codes/",
    { code: code.trim() },
  )

  return response.data.codes
}

export async function disableMfa(payload: {
  password: string
  code: string
}): Promise<void> {
  await apiClient.post("/auth/mfa/disable/", {
    password: payload.password,
    code: payload.code.trim(),
  })
}
