// ============================================================================
// Password Strength Hook
// ============================================================================

import { getPasswordStrength } from "../utils/password-strength"

export function usePasswordStrength(
  password: string,
  passwordConfirm: string,
) {
  // --------------------------------------------------------------------------
  // Individual Requirements
  // --------------------------------------------------------------------------

  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  // --------------------------------------------------------------------------
  // Password Matching
  // --------------------------------------------------------------------------

  const passwordsMatch =
    passwordConfirm.length > 0 &&
    password === passwordConfirm

  const showMismatch =
    passwordConfirm.length > 0 &&
    password !== passwordConfirm

  // --------------------------------------------------------------------------
  // Password Strength
  // --------------------------------------------------------------------------

  const strength = getPasswordStrength(password)

  const showStrength = password.length > 0

  // --------------------------------------------------------------------------
  // Submit Validation
  // --------------------------------------------------------------------------

  const canSubmit =
    passwordsMatch &&
    hasLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial

  // --------------------------------------------------------------------------
  // Requirements Array
  // --------------------------------------------------------------------------

  const requirements = [
    {
      valid: hasLength,
      text: "At least 8 characters",
    },
    {
      valid: hasLower,
      text: "One lowercase letter",
    },
    {
      valid: hasUpper,
      text: "One uppercase letter",
    },
    {
      valid: hasNumber,
      text: "One number",
    },
    {
      valid: hasSpecial,
      text: "One special character",
    },
  ]

  return {
    strength,
    showStrength,

    passwordsMatch,
    showMismatch,

    canSubmit,

    requirements,
  }
}