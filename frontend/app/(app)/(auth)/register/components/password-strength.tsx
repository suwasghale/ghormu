// ============================================================================
// Password Strength Component
// ============================================================================

import type { PasswordStrength as PasswordStrengthType } from "../utils/password-strength"

interface PasswordStrengthProps {
  strength: PasswordStrengthType | null
  visible?: boolean
}

export function PasswordStrength({
  strength,
  visible = true,
}: PasswordStrengthProps) {
  if (!visible || !strength) {
    return null
  }

  return (
    <section
      className="mt-4 space-y-2"
      aria-label="Password strength"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between text-sm">

        <span className="font-medium text-gray-600">
          Password strength
        </span>

        <span
          className={`font-semibold ${
            strength.label === "Weak"
              ? "text-red-600"
              : strength.label === "Medium"
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {strength.label}
        </span>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Progress Bar */}
      {/* ------------------------------------------------------------------ */}

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">

        <div
          className={`h-full rounded-full transition-all duration-300 ease-in-out ${strength.color}`}
          style={{
            width: `${strength.percentage}%`,
          }}
        />

      </div>

    </section>
  )
}