"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

export type TimelineStrings = {
  years: string
  previous: string
  next: string
  play: string
  pause: string
}

/** How long each date stays on screen while playing. */
export const PLAY_STEP_MS = 1600

/**
 * The control under a picture of the village through time, like Google
 * Earth's historical imagery bar: play, back, a track of dates oldest to
 * newest, and forward. Click a date, step with the buttons or the arrow keys
 * on the track (Home and End jump to the ends), or press play to step
 * through every date and stop on the newest.
 *
 * The parent owns which date is shown; this only asks to change it.
 */
export function TimelineBar({
  labels,
  index,
  onChange,
  strings,
  tone = "light",
}: {
  /** One short label per date, oldest first: a year. */
  labels: string[]
  index: number
  onChange: (index: number) => void
  strings: TimelineStrings
  tone?: "light" | "ink"
}) {
  const [playing, setPlaying] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const last = labels.length - 1

  // Play steps forward one date at a time and stops on the newest.
  const running = playing && index < last

  // Latest onChange, so a new function from the parent never restarts play.
  const change = useRef(onChange)
  useEffect(() => {
    change.current = onChange
  })

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => change.current(Math.min(index + 1, last)), PLAY_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [running, index, last])

  // On narrow screens the track scrolls sideways: keep the chosen date in
  // view. Only the track moves, never the page, even while playing.
  useEffect(() => {
    const scroller = track.current?.parentElement
    const button = track.current?.querySelectorAll("button")[index]
    if (!scroller || !button) return
    // Measured on screen: each date sits in its own positioned box, so
    // offsetLeft would only give its place inside that box.
    const left = button.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    const right = left + button.offsetWidth
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = left - (scroller.clientWidth - button.offsetWidth) / 2
    }
  }, [index])

  function choose(next: number) {
    setPlaying(false)
    onChange(Math.max(0, Math.min(next, last)))
  }

  function togglePlay() {
    if (running) return setPlaying(false)
    // From the newest date, play starts again at the oldest.
    if (index >= last) onChange(0)
    setPlaying(true)
  }

  function onTrackKey(event: React.KeyboardEvent) {
    const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last }
    if (!(event.key in moves)) return
    event.preventDefault()
    const next = Math.max(0, Math.min(moves[event.key], last))
    choose(next)
    track.current?.querySelectorAll("button")[next]?.focus()
  }

  const ink = tone === "ink"

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={running ? strings.pause : strings.play}
        className={cn(
          "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2",
          ink ? "bg-ink-foreground text-ink focus-visible:outline-earth-bright" : "bg-foreground text-background focus-visible:outline-brand",
        )}
      >
        {running ? <Pause aria-hidden="true" className="size-5 fill-current" /> : <Play aria-hidden="true" className="size-5 translate-x-px fill-current" />}
      </button>
      <StepButton label={strings.previous} disabled={index === 0} onClick={() => choose(index - 1)} ink={ink}>
        <ChevronLeft aria-hidden="true" className="size-5" />
      </StepButton>

      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div ref={track} role="group" aria-label={strings.years} onKeyDown={onTrackKey} className="relative flex min-w-max">
          <span aria-hidden="true" className={cn("absolute top-[0.9rem] right-5 left-5 h-0.5 rounded-full", ink ? "bg-ink-foreground/25" : "bg-border")} />
          {labels.map((label, i) => {
            const on = i === index
            return (
              <div key={`${label}-${i}`} className="relative flex-1">
                <button
                  type="button"
                  aria-pressed={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(i)}
                  className={cn(
                    "group flex w-full min-w-11 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 pt-1.5 pb-1 focus-visible:outline-2",
                    ink ? "focus-visible:outline-earth-bright" : "focus-visible:outline-brand",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative rounded-full transition-all",
                      on
                        ? ink
                          ? "size-4 bg-earth-bright ring-4 ring-earth-bright/25"
                          : "size-4 bg-brand ring-4 ring-brand/20"
                        : cn("mt-0.5 size-2.5", ink ? "bg-ink-foreground/50 group-hover:bg-earth-bright" : "bg-muted-foreground/60 group-hover:bg-brand"),
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      on
                        ? cn("font-bold", ink ? "text-ink-foreground" : "text-foreground")
                        : cn("font-medium", ink ? "text-ink-foreground/70 group-hover:text-ink-foreground" : "text-muted-foreground group-hover:text-foreground"),
                    )}
                  >
                    {label}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <StepButton label={strings.next} disabled={index === last} onClick={() => choose(index + 1)} ink={ink}>
        <ChevronRight aria-hidden="true" className="size-5" />
      </StepButton>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  ink,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  ink: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2",
        ink
          ? "border-ink-foreground/25 hover:border-earth-bright hover:text-earth-bright disabled:hover:border-ink-foreground/25 disabled:hover:text-current focus-visible:outline-earth-bright"
          : "border-border hover:border-brand hover:text-brand disabled:hover:border-border disabled:hover:text-current focus-visible:outline-brand",
      )}
    >
      {children}
    </button>
  )
}
