"use client"

import { useState } from "react"
import { MoveHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

export type TimeFrame = {
  id: string
  year: number
  /** The year as the page writes it, e.g. २००६. */
  yearLabel: string
  title: string
  image: string
  credit: string
}

export type ThroughTimeStrings = {
  before: string
  after: string
  compare: string
  credits: string
}

/**
 * Two dated views of the same place, one over the other, with a divider to
 * drag between them. Works with a pointer, touch, or the arrow keys: the
 * divider is a native range input stretched over the picture.
 *
 * Each image keeps its credit line directly underneath. For Google Earth
 * imagery that is a condition of use, not decoration.
 */
export function ThroughTime({ frames, strings }: { frames: TimeFrame[]; strings: ThroughTimeStrings }) {
  const sorted = [...frames].sort((a, b) => a.year - b.year)
  const [beforeId, setBeforeId] = useState(sorted[0]?.id)
  const [afterId, setAfterId] = useState(sorted[sorted.length - 1]?.id)
  const [position, setPosition] = useState(50)

  if (sorted.length < 2) return null

  const before = sorted.find((frame) => frame.id === beforeId) ?? sorted[0]
  const after = sorted.find((frame) => frame.id === afterId) ?? sorted[sorted.length - 1]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YearPicker label={strings.before} frames={sorted} selected={before.id} onSelect={setBeforeId} />
        <YearPicker label={strings.after} frames={sorted} selected={after.id} onSelect={setAfterId} className="sm:justify-end" />
      </div>

      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-3xl bg-ink ring-1 ring-border select-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- archive uploads are already optimised */}
        <img src={after.image} alt={after.title} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element -- archive uploads are already optimised */}
        <img
          src={before.image}
          alt={before.title}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          draggable={false}
        />

        <span className="absolute top-4 left-4 rounded-full bg-ink/80 px-3 py-1 font-display text-lg font-semibold text-ink-foreground backdrop-blur">
          {before.yearLabel}
        </span>
        <span className="absolute top-4 right-4 rounded-full bg-ink/80 px-3 py-1 font-display text-lg font-semibold text-ink-foreground backdrop-blur">
          {after.yearLabel}
        </span>

        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-snow shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${position}%` }}>
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-snow text-ink shadow-lg">
            <MoveHorizontal className="size-5" />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={strings.compare}
          aria-valuetext={`${position}%`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-0"
        />
      </div>

      <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">{before.yearLabel}</span> · {before.credit}
        </p>
        <p className="sm:text-right">
          <span className="font-medium text-foreground">{after.yearLabel}</span> · {after.credit}
        </p>
      </div>
    </div>
  )
}

function YearPicker({
  label,
  frames,
  selected,
  onSelect,
  className,
}: {
  label: string
  frames: TimeFrame[]
  selected: string
  onSelect: (id: string) => void
  className?: string
}) {
  return (
    <fieldset className={cn("flex flex-wrap items-center gap-2", className)}>
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="mr-1 text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      {frames.map((frame) => (
        <button
          key={frame.id}
          type="button"
          aria-pressed={frame.id === selected}
          onClick={() => onSelect(frame.id)}
          className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {frame.yearLabel}
        </button>
      ))}
    </fieldset>
  )
}
