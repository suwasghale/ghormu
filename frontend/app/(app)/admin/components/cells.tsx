"use client"

// ============================================================================
// Table cell renderers
// ============================================================================
//
// One component per column type from lib/admin/resources.ts. Split out of
// the table so the table stays about layout and these stay about display.
// ============================================================================

import { Check, ImageOff, Minus } from "lucide-react"

import type { ColumnType, Option } from "@/lib/admin/resources"

// ----------------------------------------------------------------------------
// Status
// ----------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  // Publication state.
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-amber-50 text-amber-800 ring-amber-600/20",
  archived: "bg-gray-100 text-gray-600 ring-gray-500/20",
}

const STATUS_LABELS: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
}

export function StatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value] ?? STATUS_STYLES.archived

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {STATUS_LABELS[value] ?? value}
    </span>
  )
}

// ----------------------------------------------------------------------------
// Generic badge
// ----------------------------------------------------------------------------

export function Badge({
  value,
  options,
}: {
  value: string
  options?: Option[]
}) {
  if (!value) return <Empty />

  // Show the human label where the resource defines one, so the table
  // does not read as raw database values.
  const label = options?.find((o) => o.value === value)?.label ?? value

  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  )
}

// ----------------------------------------------------------------------------
// Booleans
// ----------------------------------------------------------------------------

export function BooleanCell({ value }: { value: boolean }) {
  return value ? (
    <Check size={16} className="text-emerald-600" aria-label="Oui" />
  ) : (
    <Minus size={16} className="text-gray-300" aria-label="Non" />
  )
}

// ----------------------------------------------------------------------------
// Dates
// ----------------------------------------------------------------------------

/**
 * Rendered on the client only.
 *
 * Formatting a date on the server and hydrating it on the client
 * produces a mismatch whenever the two disagree about the timezone,
 * which for a team spread across timezones is most of the time. The
 * viewer's own locale and timezone are used.
 */
export function DateCell({ value }: { value: string | null }) {
  if (!value) return <Empty />

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return <Empty />

  return (
    <time dateTime={value} className="text-sm text-gray-600">
      {date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </time>
  )
}

// ----------------------------------------------------------------------------
// Images
// ----------------------------------------------------------------------------

export function ImageCell({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
        <ImageOff size={14} className="text-gray-400" aria-label="No image" />
      </div>
    )
  }

  // A plain <img>: these are 40px thumbnails from arbitrary external
  // hosts, and routing them through next/image would need every one of
  // those hosts in remotePatterns for no measurable gain.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded-md object-cover"
      loading="lazy"
    />
  )
}

// ----------------------------------------------------------------------------

function Empty() {
  return <span className="text-sm text-gray-300">—</span>
}

// ----------------------------------------------------------------------------
// Dispatch
// ----------------------------------------------------------------------------

export function renderCell(
  type: ColumnType | undefined,
  value: unknown,
  options?: Option[],
) {
  switch (type) {
    case "status":
      return <StatusBadge value={String(value ?? "")} />

    case "badge":
      return <Badge value={String(value ?? "")} options={options} />

    case "boolean":
      return <BooleanCell value={Boolean(value)} />

    case "date":
      return <DateCell value={value ? String(value) : null} />

    case "image":
      return <ImageCell src={value ? String(value) : null} alt="" />

    case "number":
      return (
        <span className="text-sm tabular-nums text-gray-700">
          {value === null || value === undefined || value === "" ? "—" : String(value)}
        </span>
      )

    default: {
      const text = value === null || value === undefined ? "" : String(value)

      if (!text) return <Empty />

      return (
        <span className="line-clamp-2 text-sm text-gray-900">{text}</span>
      )
    }
  }
}
