"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, MoveHorizontal, Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

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

export type ThroughTimeStrings = {
  view: string
  timeline: string
  compareMode: string
  years: string
  previous: string
  next: string
  play: string
  pause: string
  before: string
  after: string
  compare: string
  credits: string
}

/** How long each year stays on screen while playing. */
const PLAY_STEP_MS = 1600

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
  const [playing, setPlaying] = useState(false)
  const track = useRef<HTMLDivElement>(null)

  const frame = frames[index]
  const last = frames.length - 1

  // Play steps forward one year at a time and stops on the newest.
  const running = playing && index < last

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setIndex((current) => Math.min(current + 1, last)), PLAY_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [running, index, last])

  // Fetch the next year's picture ahead, so playing and stepping feel instant.
  useEffect(() => {
    const ahead = frames[index + 1] ?? frames[index - 1]
    if (ahead) new window.Image().src = ahead.image
  }, [frames, index])

  // On narrow screens the track scrolls sideways: keep the chosen year in
  // view. Only the track moves, never the page, even while playing.
  useEffect(() => {
    const scroller = track.current?.parentElement
    const button = track.current?.querySelectorAll("button")[index]
    if (!scroller || !button) return
    // Measured on screen: each year sits in its own positioned box, so
    // offsetLeft would only give its place inside that box.
    const left = button.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    const right = left + button.offsetWidth
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = left - (scroller.clientWidth - button.offsetWidth) / 2
    }
  }, [index])

  function choose(next: number) {
    setPlaying(false)
    setIndex(Math.max(0, Math.min(next, last)))
  }

  function togglePlay() {
    if (running) return setPlaying(false)
    // From the newest year, play starts again at the oldest.
    if (index >= last) setIndex(0)
    setPlaying(true)
  }

  function onTrackKey(event: React.KeyboardEvent) {
    const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last }
    if (!(event.key in moves)) return
    event.preventDefault()
    choose(moves[event.key])
    track.current?.querySelectorAll("button")[Math.max(0, Math.min(moves[event.key], last))]?.focus()
  }

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

      <div className="mt-5 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={running ? strings.pause : strings.play}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {running ? <Pause aria-hidden="true" className="size-5 fill-current" /> : <Play aria-hidden="true" className="size-5 translate-x-px fill-current" />}
        </button>
        <StepButton label={strings.previous} disabled={index === 0} onClick={() => choose(index - 1)}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </StepButton>

        {/* The years, oldest to newest, on a line like Google Earth's. Scrolls sideways on its own when there are more than fit. */}
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div ref={track} role="group" aria-label={strings.years} onKeyDown={onTrackKey} className="relative flex min-w-max">
            <span aria-hidden="true" className="absolute top-[0.9rem] right-5 left-5 h-0.5 rounded-full bg-border" />
            {frames.map((item, i) => {
              const on = i === index
              return (
                <div key={item.id} className="relative flex-1">
                  <button
                    type="button"
                    aria-pressed={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(i)}
                    className="group flex w-full min-w-11 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 pt-1.5 pb-1 focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative rounded-full transition-all",
                        on ? "size-4 bg-brand ring-4 ring-brand/20" : "mt-0.5 size-2.5 bg-muted-foreground/60 group-hover:bg-brand",
                      )}
                    />
                    <span className={cn("text-xs tabular-nums", on ? "font-bold text-foreground" : "font-medium text-muted-foreground group-hover:text-foreground")}>
                      {item.yearLabel}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <StepButton label={strings.next} disabled={index === last} onClick={() => choose(index + 1)}>
          <ChevronRight aria-hidden="true" className="size-5" />
        </StepButton>
      </div>
    </div>
  )
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border transition-colors hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </button>
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
