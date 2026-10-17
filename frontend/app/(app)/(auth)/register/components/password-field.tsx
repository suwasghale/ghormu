// ============================================================================
// Password Field Component
// ============================================================================

"use client"

import { useState } from "react"

import {
  Eye,
  EyeOff,
} from "lucide-react"

interface PasswordFieldProps {
  id: string
  label: string

  value: string

  onChange: (
    value: string,
  ) => void

  autoComplete?:
    | "current-password"
    | "new-password"

  placeholder?: string

  required?: boolean

  disabled?: boolean

  error?: boolean

  helperText?: string
}

export function PasswordField({
  id,
  label,

  value,

  onChange,

  autoComplete = "new-password",

  placeholder,

  required = false,

  disabled = false,

  error = false,

  helperText,
}: PasswordFieldProps) {
  const [visible, setVisible] =
    useState(false)

  return (
    <div className="space-y-2">

      {/* -------------------------------------------------------- */}
      {/* Label */}
      {/* -------------------------------------------------------- */}

      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* -------------------------------------------------------- */}
      {/* Input */}
      {/* -------------------------------------------------------- */}

      <div className="relative">

        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={`
            w-full
            rounded-lg
            border
            px-4
            py-3
            pr-12
            outline-none
            transition-all
            duration-200

            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10"
            }

            ${
              disabled
                ? "cursor-not-allowed bg-gray-100 text-gray-500"
                : ""
            }
          `}
        />

        {/* ------------------------------------------------------ */}
        {/* Toggle */}
        {/* ------------------------------------------------------ */}

        <button
          type="button"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          onClick={() =>
            setVisible(
              (prev) => !prev,
            )
          }
          disabled={disabled}
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2

            rounded-md
            p-1.5

            text-gray-500

            transition-colors

            hover:bg-gray-100
            hover:text-black

            focus:outline-none
            focus:ring-2
            focus:ring-black/10

            disabled:pointer-events-none
            disabled:opacity-50
          "
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>

      </div>

      {/* -------------------------------------------------------- */}
      {/* Helper */}
      {/* -------------------------------------------------------- */}

      {helperText && (
        <p
          className={`
            text-sm

            ${
              error
                ? "text-red-600"
                : "text-gray-500"
            }
          `}
        >
          {helperText}
        </p>
      )}

    </div>
  )
}