"use client"

// ============================================================================
// Resource form
// ============================================================================
//
// Create and edit for any resource in lib/admin/resources.ts. Fields are
// grouped into fieldsets by their `group`, which is what puts the French
// and English columns side by side instead of interleaving them.
//
// Only changed fields are sent. The API takes PATCH, so submitting the
// whole form would have two editors on one record silently overwrite each
// other's untouched fields.
// ============================================================================

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import ImageField from "./image-field"
import RichTextField from "./rich-text"

import {
  adminResource,
  errorMessage,
  extractFieldErrors,
  type AdminRow,
  type FieldErrors,
} from "@/lib/api/admin/client"
import { RESOURCES, type FieldDef } from "@/lib/admin/resources"
import { useAuthStore } from "@/store/auth-store"
import {
  isComplete,
  isFilled,
  validateAll,
  validateField,
} from "@/lib/admin/validate"

type Row = AdminRow & Record<string, unknown>
type FormState = Record<string, unknown>

interface Props {
  /** See the note in resource-table.tsx: icons are not serialisable. */
  resourceKey: string

  /** `null` for the create form. */
  id: string | null
}

export default function ResourceForm({ resourceKey, id }: Props) {
  const isSuperuser = useAuthStore((state) => state.user?.is_superuser === true)
  const resource = RESOURCES[resourceKey]
  const router = useRouter()
  const api = useMemo(() => adminResource<Row>(resource.key), [resource.key])

  const isNew = id === null

  const [values, setValues] = useState<FormState>(() =>
    isNew ? defaultValues(resource.fields) : {},
  )
  const [initial, setInitial] = useState<FormState>({})

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  // Which fields the editor has actually visited. A pristine create form
  // must not open covered in "required" — the errors appear as each
  // field is left, and all at once only on a failed submit.
  const [touched, setTouched] = useState<Record<string, boolean>>({})


  // --------------------------------------------------------------------------
  // Load
  // --------------------------------------------------------------------------

  useEffect(() => {
    // Nothing to fetch for a create form; its defaults are the initial
    // state above.
    if (isNew) return

    let cancelled = false

    async function load() {
      try {
        const row = await api.retrieve(id!)

        if (cancelled) return

        const state = toFormState(resource.fields, row)

        setValues(state)
        setInitial(state)
      } catch (caught) {
        if (!cancelled) {
          setLoadError(
            errorMessage(caught, "Could not load this record."),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [api, id, isNew, resource.fields])

  // --------------------------------------------------------------------------
  // Save
  // --------------------------------------------------------------------------

  function setValue(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }))

    // Clear the error as soon as the field is edited; leaving it up
    // while someone fixes it reads as though the fix did not register.
    // Re-validation happens on blur, not on every keystroke — flagging
    // "adresse email invalide" at the third character is noise.
    setErrors((current) => {
      if (!current[name]) return current

      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function validateOne(field: FieldDef) {
    setTouched((current) => ({ ...current, [field.name]: true }))

    const message = validateField(field, values[field.name])

    setErrors((current) => {
      const next = { ...current }

      if (message) next[field.name] = message
      else delete next[field.name]

      return next
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Everything is checked here, not just what has been visited: a
    // form can be submitted with Enter from the first field.
    const clientErrors = validateAll(resource.fields, values)

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setTouched(
        Object.fromEntries(resource.fields.map((field) => [field.name, true])),
      )

      const first = resource.fields.find((field) => clientErrors[field.name])

      // Scroll the first offender into view; on a form this long the
      // error can easily be off-screen, and nothing appears to happen.
      if (first) {
        document
          .getElementById(`field-${first.name}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      toast.error("Fix the highlighted fields before saving.")
      return
    }

    setSaving(true)
    setErrors({})

    const payload = isNew
      ? cleanForCreate(resource.fields, values)
      : changedOnly(resource.fields, initial, values)

    if (!isNew && Object.keys(payload).length === 0) {
      toast.info("No changes to save.")
      setSaving(false)
      return
    }

    try {
      const saved = isNew
        ? await api.create(payload as Partial<Row>)
        : await api.patch(id!, payload as Partial<Row>)

      toast.success(
        isNew
          ? `${resource.labelSingular} created.`
          : `${resource.labelSingular} saved.`,
      )

      if (isNew) {
        router.replace(`/admin/${resource.key}/${saved.id}`)
        return
      }

      const state = toFormState(resource.fields, saved)
      setValues(state)
      setInitial(state)
    } catch (caught) {
      const fieldErrors = extractFieldErrors(caught)

      setErrors(fieldErrors)

      toast.error(
        fieldErrors.__all__ ??
          errorMessage(caught, "Saving failed."),
      )
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------------------------------

  const groups = useMemo(() => groupFields(resource.fields), [resource.fields])

  const dirty =
    !isNew && Object.keys(changedOnly(resource.fields, initial, values)).length > 0

  // The save button is gated on completeness, not on validity: it
  // unlocks once every required field has something in it, and format
  // mistakes are reported inline. Gating on full validity instead would
  // leave someone staring at a dead button with nothing telling them
  // which field is holding it.
  const complete = isComplete(resource.fields, values)

  const canSave = complete && !saving && (isNew || dirty)

  const saveClass = canSave
    ? "bg-black text-white hover:bg-gray-800"
    : "cursor-not-allowed bg-gray-200 text-gray-400"

  if (resourceKey === "users" && !isSuperuser) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Accounts are read-only</h1>
        <p>Only a superuser can edit accounts.</p>
        <Link href="/admin/users" className="font-medium underline">Back to accounts</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-red-600">{loadError}</p>
        <Link
          href={`/admin/${resource.key}`}
          className="mt-4 inline-block text-sm font-medium text-gray-900 underline"
        >
          Back to the list
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* ==================================================================== */}
      {/* Header                                                               */}
      {/* ==================================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/admin/${resource.key}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            {resource.label}
          </Link>

          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900">
            {isNew
              ? `New ${resource.labelSingular.toLowerCase()}`
              : String(values[resource.titleField] || resource.labelSingular)}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSave}
            title={
              complete
                ? undefined
                : "Fill in every required field to save."
            }
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${saveClass}`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save
          </button>
        </div>
      </div>

      {errors.__all__ && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errors.__all__}
        </p>
      )}

      {/* ==================================================================== */}
      {/* Fieldsets                                                            */}
      {/* ==================================================================== */}

      {groups.map(([groupName, fields]) => (
        <fieldset
          key={groupName}
          className="rounded-xl border border-gray-200 bg-white p-6"
        >
          <legend className="px-2 text-sm font-semibold text-gray-900">
            {groupName}
          </legend>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name]}
                error={touched[field.name] ? errors[field.name] : undefined}
                onChange={(value) => setValue(field.name, value)}
                onBlur={() => validateOne(field)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {/* ==================================================================== */}
      {/* Sticky save bar — the forms are long enough that the button at the  */}
      {/* top scrolls away well before someone finishes editing.              */}
      {/* ==================================================================== */}

      {(dirty || isNew || !complete) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-8 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {!complete
                ? missingLabel(resource.fields, values)
                : isNew
                  ? "This record has not been created yet."
                  : "Unsaved changes."}
            </p>

            <button
              type="submit"
              disabled={!canSave}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${saveClass}`}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

// ============================================================================
// One input
// ============================================================================

function Field({
  field,
  value,
  error,
  onChange,
  onBlur,
}: {
  field: FieldDef
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  onBlur: () => void
}) {
  const id = `field-${field.name}`

  // Long-form inputs get the full width; short ones sit two per row.
  const wide =
    field.type === "textarea" ||
    field.type === "html" ||
    field.type === "image"

  const describedBy = [
    field.help ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ")

  const inputClass = `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors ${
    error
      ? "border-red-300 focus:border-red-500"
      : "border-gray-200 focus:border-gray-900"
  } ${field.readOnly ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""}`

  return (
    <div className={wide ? "md:col-span-2" : ""}>
      {field.type !== "boolean" && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      {field.type === "boolean" ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            disabled={field.readOnly}
            onChange={(event) => onChange(event.target.checked)}
            onBlur={onBlur}
            aria-describedby={describedBy || undefined}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black"
          />
          <span className="text-sm font-medium text-gray-700">
            {field.label}
          </span>
        </label>
      ) : field.type === "select" ? (
        <select
          id={id}
          value={String(value ?? "")}
          disabled={field.readOnly}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={inputClass}
        >
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "html" ? (
        <RichTextField
          id={id}
          value={String(value ?? "")}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={field.placeholder}
          invalid={Boolean(error)}
          describedBy={describedBy || undefined}
          rows={field.rows ?? 10}
        />
      ) : field.type === "image" ? (
        <ImageField
          id={id}
          value={String(value ?? "")}
          onChange={onChange}
          onBlur={onBlur}
          invalid={Boolean(error)}
          describedBy={describedBy || undefined}
        />
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          value={String(value ?? "")}
          rows={field.rows ?? 4}
          disabled={field.readOnly}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          type={
            field.type === "number"
              ? "number"
              : field.type === "email"
                ? "email"
                : field.type === "url"
                  ? "url"
                  : field.type === "datetime"
                    ? "datetime-local"
                    : field.type === "date"
                      ? "date"
                      : "text"
          }
          value={String(value ?? "")}
          disabled={field.readOnly}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(
              field.type === "number"
                ? event.target.value === ""
                  ? null
                  : Number(event.target.value)
                : event.target.value,
            )
          }
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={inputClass}
        />
      )}

      {field.help && (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-gray-500">
          {field.help}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Form state helpers
// ============================================================================

function missingLabel(fields: FieldDef[], values: FormState): string {
  const missing = fields.filter(
    (field) =>
      field.required && !field.readOnly && !isFilled(field, values[field.name]),
  )

  if (missing.length === 0) return ""

  if (missing.length === 1) {
    return `Required field missing: ${missing[0].label}.`
  }

  return `${missing.length} required fields missing: ${missing
    .map((field) => field.label)
    .join(", ")}.`
}


function groupFields(fields: FieldDef[]): [string, FieldDef[]][] {
  const groups = new Map<string, FieldDef[]>()

  for (const field of fields) {
    const name = field.group ?? "General"

    groups.set(name, [...(groups.get(name) ?? []), field])
  }

  return [...groups.entries()]
}

function defaultValues(fields: FieldDef[]): FormState {
  const state: FormState = {}

  for (const field of fields) {
    if (field.type === "boolean") state[field.name] = false
    else if (field.name === "status") state[field.name] = "draft"
    else state[field.name] = ""
  }

  return state
}

/**
 * Server row → form state.
 *
 * `datetime-local` will not accept an ISO string with a timezone, and
 * silently renders an empty input if given one — so the offset is
 * trimmed rather than passed through.
 */
function toFormState(fields: FieldDef[], row: Row): FormState {
  const state: FormState = {}

  for (const field of fields) {
    const value = row[field.name]

    if (field.type === "boolean") {
      state[field.name] = Boolean(value)
    } else if (field.type === "datetime") {
      state[field.name] = value ? String(value).slice(0, 16) : ""
    } else if (field.type === "date") {
      // "YYYY-MM-DD" — the first ten characters, whether the API sent a
      // bare date or a full timestamp.
      state[field.name] = value ? String(value).slice(0, 10) : ""
    } else {
      state[field.name] = value ?? ""
    }
  }

  return state
}

/** Empty strings become `null` for nullable columns and are dropped otherwise. */
function cleanForCreate(fields: FieldDef[], values: FormState): FormState {
  const payload: FormState = {}

  for (const field of fields) {
    if (field.readOnly) continue

    const value = values[field.name]

    // Let the server apply its own defaults rather than sending "" and
    // failing validation on a field the editor never touched.
    if (value === "" || value === undefined) continue

    payload[field.name] = value
  }

  return payload
}

function changedOnly(
  fields: FieldDef[],
  initial: FormState,
  values: FormState,
): FormState {
  const payload: FormState = {}

  for (const field of fields) {
    if (field.readOnly) continue

    const before = initial[field.name]
    const after = values[field.name]

    // Array values need a value comparison, not a reference one.
    const same =
      Array.isArray(before) || Array.isArray(after)
        ? JSON.stringify(before ?? []) === JSON.stringify(after ?? [])
        : (before ?? "") === (after ?? "")

    if (same) continue

    // A cleared optional field means null, not "". Django rejects "" on
    // a nullable non-string column such as `published_at`.
    payload[field.name] =
      after === "" && (field.type === "datetime" || field.type === "number")
        ? null
        : after
  }

  return payload
}
