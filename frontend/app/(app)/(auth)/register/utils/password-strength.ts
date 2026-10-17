// ============================================================================
// Password Strength Utility
// ============================================================================

export interface PasswordStrength {
  label: "Weak" | "Medium" | "Strong"
  color: string
  percentage: number
}

export function getPasswordStrength(
  password: string,
): PasswordStrength | null {
  if (!password) {
    return null
  }

  let score = 0

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  switch (true) {
    case score <= 2:
      return {
        label: "Weak",
        color: "bg-red-500",
        percentage: 33,
      }

    case score <= 4:
      return {
        label: "Medium",
        color: "bg-yellow-500",
        percentage: 66,
      }

    default:
      return {
        label: "Strong",
        color: "bg-green-500",
        percentage: 100,
      }
  }
}