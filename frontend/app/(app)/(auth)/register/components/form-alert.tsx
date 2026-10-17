// ============================================================================
// Form Alert Component
// ============================================================================

import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react"

type AlertVariant =
  | "success"
  | "error"
  | "warning"
  | "info"

interface FormAlertProps {
  variant: AlertVariant
  message?: string | null
}

const styles: Record<
  AlertVariant,
  {
    icon: React.ReactNode
    container: string
    iconColor: string
    textColor: string
  }
> = {
  success: {
    icon: <CheckCircle2 size={20} />,
    container:
      "border-green-200 bg-green-50",
    iconColor: "text-green-600",
    textColor: "text-green-700",
  },

  error: {
    icon: <AlertCircle size={20} />,
    container:
      "border-red-200 bg-red-50",
    iconColor: "text-red-600",
    textColor: "text-red-700",
  },

  warning: {
    icon: <TriangleAlert size={20} />,
    container:
      "border-yellow-200 bg-yellow-50",
    iconColor: "text-yellow-600",
    textColor: "text-yellow-700",
  },

  info: {
    icon: <Info size={20} />,
    container:
      "border-blue-200 bg-blue-50",
    iconColor: "text-blue-600",
    textColor: "text-blue-700",
  },
}

export function FormAlert({
  variant,
  message,
}: FormAlertProps) {
  if (!message) {
    return null
  }

  const style = styles[variant]

  return (
    <div
      role="alert"
      className={`
        flex
        items-start
        gap-3

        rounded-lg
        border

        p-4

        ${style.container}
      `}
    >
      <div
        className={`
          mt-0.5
          shrink-0

          ${style.iconColor}
        `}
      >
        {style.icon}
      </div>

      <p
        className={`
          text-sm
          leading-6

          ${style.textColor}
        `}
      >
        {message}
      </p>
    </div>
  )
}