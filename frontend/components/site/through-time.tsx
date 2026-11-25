"use client"

import { useEffect, useState } from "react"
import { MoveHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

import { TimelineBar, type TimelineStrings } from "./timeline-bar"

export type TimeFrame = {
  id: string
  year: number
  /** The year as the page writes it, e.g. २००६. */
  yearLabel: string
  /** The capture date as the editor wrote it ("Jan 20, 2026"), else the year. */
  dateLabel: string
  title: string
  image: string
  credit: string
}

export type ThroughTimeStrings = TimelineStrings & {
  view: string
  timeline: string
  compareMode: string
  before: string
  after: string
  compare: string
  credits: string
}

/**
 * The same place seen from above in different years. Two ways to look:
 *
 * - Timeline: one picture and a track of years under it, like Google
 *   Earth's historical imagery. Click a year, step with the arrows (or the
 *   arrow keys on the track), or press play to watch the village change.
 * - Compare: any two years, one over the other, with a divider to drag.
 *
 * Each picture keeps its credit line directly underneath. For Google Earth
 * imagery that is a condition of use, not decoration.
 */
export function ThroughTime({ frames, strings }: { frames: TimeFrame[]; strings: ThroughTimeStrings }) {
  const [mode, setMode] = useState<"timeline" | "compare">("timeline")
  const sorted = [...frames].sort((a, b) => a.year - b.year)

  if (sorted.length < 2) return null

  return (
    <div>
      <div role="group" aria-label={strings.view} className="inline-flex rounded-full border border-border bg-background p-1">
        {(["timeline", "compare"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
            className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors hover:text-brand aria-pressed:bg-foreground aria-pressed:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {key === "timeline" ? strings.timeline : strings.compareMode}
          </button>
        ))}
      </div>

      <div className="mt-6">{mode === "timeline" ? <Timeline frames={sorted} strings={strings} /> : <Compare frames={sorted} strings={strings} />}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function Timeline({ frames, strings }: { frames: TimeFrame[]; strings: ThroughTimeStrings }) {
  // Opens on the newest year, the way the village looks now.
  const [index, setIndex] = useState(frames.length - 1)
  // The year whose picture has finished loading. It stays on screen until
  // the chosen year's picture is ready, so switching never flashes empty.
  const [shown, setShown] = useState(frames.length - 1)

  const frame = frames[index]

  // Fetch the next year's picture ahead, so playing and stepping feel instant.
  useEffect(() => {
    const ahead = frames[index + 1] ?? frames[index - 1]
    if (ahead) new window.Image().src = ahead.image
  }, [frames, index])

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ink ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element -- archive uploads are already optimised */}
        <img src={frames[shown].image} alt={frames[shown].title} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {shown !== index && (
          // eslint-disable-next-line @next/next/no-img-element -- archive uploads are already optimised
          <img
            key={frame.id}
            src={frame.image}
            alt=""
            onLoad={() => setShown(index)}
            ref={(image) => {
              if (image?.complete && image.naturalWidth) setShown(index)
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-0"
            draggable={false}
          />
        )}

        <p aria-live="polite" className="absolute top-4 left-4 rounded-lg bg-ink/80 px-3 py-1.5 text-ink-foreground backdrop-blur">
          <span className="block font-display text-2xl leading-tight font-bold">{frame.yearLabel}</span>
          {frame.dateLabel !== frame.yearLabel && <span className="block text-sm text-ink-foreground/80">{frame.dateLabel}</span>}
        </p>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{frame.yearLabel}</span> · {frame.credit}
      </p>

      <div className="mt-5">
        <TimelineBar labels={frames.map((item) => item.yearLabel)} index={index} onChange={setIndex} strings={strings} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compare two years
// ---------------------------------------------------------------------------

/**
 * Two dated views, one over the other, with a divider to drag between them.
 * Works with a pointer, touch, or the arrow keys: the divider is a native
 * range input stretched over the picture.
 */
function Compare({ frames, strings }: { frames: TimeFrame[]; strings: ThroughTimeStrings }) {
  const [beforeId, setBeforeId] = useState(frames[0].id)
  const [afterId, setAfterId] = useState(frames[frames.length - 1].id)
  const [position, setPosition] = useState(50)

  const before = frames.find((frame) => frame.id === beforeId) ?? frames[0]
  const after = frames.find((frame) => frame.id === afterId) ?? frames[frames.length - 1]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YearPicker label={strings.before} frames={frames} selected={before.id} onSelect={setBeforeId} />
        <YearPicker label={strings.after} frames={frames} selected={after.id} onSelect={setAfterId} className="sm:justify-end" />
      </div>

      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-xl bg-ink ring-1 ring-border select-none">
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

        <span className="absolute top-4 left-4 rounded-lg bg-ink/80 px-3 py-1 font-display text-lg font-bold text-ink-foreground backdrop-blur">{before.yearLabel}</span>
        <span className="absolute top-4 right-4 rounded-lg bg-ink/80 px-3 py-1 font-display text-lg font-bold text-ink-foreground backdrop-blur">{after.yearLabel}</span>

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
