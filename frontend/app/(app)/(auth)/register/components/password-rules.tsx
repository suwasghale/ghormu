// ============================================================================
// Password Rules Component
// ============================================================================

import {
  CheckCircle2,
  MinusCircle,
} from "lucide-react"

interface PasswordRequirement {
  valid: boolean
  text: string
}

interface PasswordRulesProps {
  requirements: PasswordRequirement[]
  visible?: boolean
}

function RequirementItem({
  valid,
  text,
}: PasswordRequirement) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors duration-300 ${
        valid
          ? "text-green-600"
          : "text-red-500"
      }`}
    >
      {valid ? (
        <CheckCircle2
          size={16}
          className="shrink-0"
        />
      ) : (
        <MinusCircle
          size={16}
          className="shrink-0"
        />
      )}

      <span>{text}</span>
    </div>
  )
}

export function PasswordRules({
  requirements,
  visible = true,
}: PasswordRulesProps) {
  if (!visible) {
    return null
  }

  return (
    <section
      className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4"
      aria-label="Password requirements"
    >
      <h3 className="text-sm font-medium text-gray-700">
        Password requirements
      </h3>

      <div className="space-y-2 text-sm">
        {requirements.map((requirement) => (
          <RequirementItem
            key={requirement.text}
            valid={requirement.valid}
            text={requirement.text}
          />
        ))}
      </div>
    </section>
  )
}