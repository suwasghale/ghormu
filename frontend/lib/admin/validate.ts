// ============================================================================
// Client-side form validation
// ============================================================================
//
// The server is still the authority — every rule here exists there too, and
// a save that gets past this will still be checked. What this buys is
// *timing*: an editor learns a field is wrong while they are looking at it,
// not after a round trip.
//
// Rules are derived from the field definition rather than written per
// resource, so a new field is validated the moment it is declared.
// ============================================================================

import type { FieldDef } from "@/lib/admin/resources"

export type FormState = Record<string, unknown>
export type Errors = Record<string, string>

/** Matches the backend's ALLOWED_SCHEMES for links. */
const URL_PATTERN = /^https?:\/\/\S+\.\S+/i

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Whether a value counts as filled.
 *
 * `false` is a legitimate answer for a checkbox, and `0` for a number,
 * so neither may be treated as empty — a required boolean is satisfied
 * by being answered, not by being true.
 */
export function isFilled(field: FieldDef, value: unknown): boolean {
  if (field.type === "boolean") return value !== undefined && value !== null

  if (field.type === "number") {
    return value !== "" && value !== null && value !== undefined
  }

  if (field.type === "html") {
    // A rich-text field is empty when it holds only markup: `<p></p>`,
    // a stray `<br>`, or tags with no text between them.
    return String(value ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  }

  return String(value ?? "").trim().length > 0
}

/**
 * Validate one field. Returns a message, or null when it is fine.
 */
export function validateField(field: FieldDef, value: unknown): string | null {
  if (field.readOnly) return null

  const filled = isFilled(field, value)

  if (field.required && !filled) {
    return "This field is required."
  }

  // Everything below is a format rule, and an empty optional field has
  // no format to be wrong about.
  if (!filled) return null

  const text = String(value ?? "").trim()

  switch (field.type) {
    case "url":
    case "image":
      if (!URL_PATTERN.test(text)) {
        return "Enter a full address starting with https://."
      }
      break

    case "email":
      if (!EMAIL_PATTERN.test(text)) {
        return "Enter a valid email address."
      }
      break

    case "number": {
      const parsed = Number(value)

      if (Number.isNaN(parsed)) return "Enter a number."
      break
    }

    case "text":
      if (field.name === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)) {
        return "Use lowercase letters, numbers and hyphens only."
      }
      break
  }

  return null
}

/**
 * Validate the whole form.
 */
export function validateAll(fields: FieldDef[], values: FormState): Errors {
  const errors: Errors = {}

  for (const field of fields) {
    const message = validateField(field, values[field.name])

    if (message) errors[field.name] = message
  }

  return errors
}

/**
 * Whether every required field is filled.
 *
 * Drives the save button's enabled state. Deliberately weaker than
 * `validateAll`: the button unlocks once the form is *complete*, and
 * format mistakes are reported inline as they happen. Gating the button
 * on full validity instead would leave someone staring at a dead button
 * with no indication of which field is holding it.
 */
export function isComplete(fields: FieldDef[], values: FormState): boolean {
  return fields
    .filter((field) => field.required && !field.readOnly)
    .every((field) => isFilled(field, values[field.name]))
}
