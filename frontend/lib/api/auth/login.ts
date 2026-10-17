import { apiClient, ApiError } from "../client";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export type LoginResult =
  | { kind: "authenticated"; session: LoginResponse["data"] }
  | { kind: "mfa"; ticket: string; expiresIn: number };

/**
 * The second-factor challenge carried by a 401, if this is one.
 *
 * Password and social sign-in both answer `mfa_required` with a ticket in
 * `errors` instead of issuing a session.
 */
export function mfaChallengeFrom(
  error: unknown,
): { ticket: string; expiresIn: number } | null {
  if (!(error instanceof ApiError) || error.status !== 401) return null;

  const errors = (error.data as { errors?: unknown } | null)?.errors;
  if (!errors || typeof errors !== "object") return null;

  const challenge = errors as { mfa_ticket?: unknown; expires_in?: unknown };
  if (typeof challenge.mfa_ticket !== "string" || typeof challenge.expires_in !== "number") {
    return null;
  }

  return { ticket: challenge.mfa_ticket, expiresIn: challenge.expires_in };
}

/** Turn a sign-in request into a session or a second-factor challenge. */
export async function toLoginResult(
  request: Promise<LoginResponse>,
): Promise<LoginResult> {
  try {
    const response = await request;
    return { kind: "authenticated", session: response.data };
  } catch (error) {
    const challenge = mfaChallengeFrom(error);
    if (challenge) return { kind: "mfa", ...challenge };
    throw error;
  }
}

export async function login(payload: LoginRequest): Promise<LoginResult> {
  return toLoginResult(
    apiClient.post<LoginResponse>("/auth/login/", payload, { auth: false }),
  );
}

export async function verifyMFA(ticket: string, code: string): Promise<LoginResponse["data"]> {
  const response = await apiClient.post<LoginResponse>("/auth/mfa/verify/", {
    mfa_ticket: ticket, code: code.trim(),
  }, { auth: false });
  return response.data;
}
