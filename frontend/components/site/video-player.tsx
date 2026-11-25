"use client"

import { ArrowUpRight, Play } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { buttonStyles } from "@/components/site/section"
import {
  embedUrl,
  type Video,
  type VideoCategory,
  videoCategories,
  videoCategory,
  videoChannels,
  videoKinds,
  type VideoText,
  youtubeUrl,
} from "@/content/videos"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/** Colours for a light section (`mist`) or a dark one (`ink`). */
const tones = {
  light: {
    meta: "text-muted-foreground",
    channel: "text-foreground decoration-border",
    button: buttonStyles.secondary,
    focus: "focus-visible:outline-brand",
    chip: "border-border hover:border-brand hover:text-brand",
    chipOn: "border-foreground bg-foreground text-background hover:border-foreground hover:text-background",
    // The section is mist-toned, so the chosen row lifts to white.
    row: "hover:bg-background/60",
    rowOn: "bg-background shadow-sm",
    nameOn: "text-brand",
  },
  ink: {
    meta: "text-ink-foreground/70",
    channel: "text-ink-foreground decoration-ink-foreground/30",
    button: buttonStyles.ghostOnInk,
    focus: "focus-visible:outline-earth-bright",
    chip: "border-ink-foreground/25 text-ink-foreground/85 hover:border-earth-bright hover:text-earth-bright",
    chipOn: "border-ink-foreground bg-ink-foreground text-ink hover:border-ink-foreground hover:text-ink",
    row: "hover:bg-white/5",
    rowOn: "bg-white/10",
    nameOn: "text-earth-bright",
  },
} as const

/**
 * One player, the kinds of video to choose between, and the list beside it.
 * The stage shows the chosen video's thumbnail (served from this site) until
 * someone presses play; only then is YouTube's player loaded, so the page
 * stays light on a weak connection.
 */
export function VideoPlayer({
  videos,
  locale,
  text,
  tone = "light",
}: {
  videos: Video[]
  locale: Locale
  text: VideoText
  tone?: keyof typeof tones
}) {
  const [current, setCurrent] = useState(videos[0].id)
  const [playing, setPlaying] = useState(false)
  const [category, setCategory] = useState<VideoCategory | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const c = tones[tone]

  const video = videos.find((item) => item.id === current) ?? videos[0]
  const channel = videoChannels[video.channel]
  const name = video.name[locale]
  const shown = category ? videos.filter((item) => videoCategory(item) === category) : videos

  function choose(id: string) {
    setCurrent(id)
    setPlaying(true)

    // On a phone the list sits below the player: bring the player back up.
    // Instantly: a smooth scroll stalls while YouTube's player is loading.
    const box = stage.current?.getBoundingClientRect()
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
      stage.current?.scrollIntoView({ behavior: "instant", block: "start" })
    }
  }

  const filters: { key: VideoCategory | null; label: string; count: number }[] = [
    { key: null, label: text.all, count: videos.length },
    ...videoCategories.map((key) => ({
      key,
      label: text.categories[key],
      count: videos.filter((item) => videoCategory(item) === key).length,
    })),
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-[7fr_4fr] lg:gap-10">
      <div>
        <div ref={stage} className="relative aspect-video scroll-mt-24 overflow-hidden rounded-xl bg-ink shadow-xl shadow-black/10">
          {playing ? (
            <iframe
              key={video.id}
              src={embedUrl(video)}
              title={`${name} · ${channel.name}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 size-full cursor-pointer focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-earth-bright"
            >
              <Image
                src={video.thumbnail}
                alt=""
                fill
                placeholder="blur"
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg transition-transform group-hover:scale-105 sm:size-20 motion-reduce:transition-none">
                  <Play aria-hidden="true" className="size-7 translate-x-0.5 fill-current sm:size-8" />
                </span>
              </span>
              <span className="sr-only">
                {text.play}: {name}
              </span>
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div aria-live="polite">
            <h3 className="font-display text-2xl leading-tight font-semibold sm:text-3xl">{name}</h3>
            <p className={cn("mt-1.5", c.meta)}>
              {videoKinds[video.kind][locale]} · {text.by}:{" "}
              <a href={channel.url} target="_blank" rel="noopener noreferrer" className={cn("font-medium underline underline-offset-4 hover:decoration-current", c.channel)}>
                {channel.name}
              </a>
            </p>
          </div>
          <a href={youtubeUrl(video)} target="_blank" rel="noopener noreferrer" className={cn(c.button, "shrink-0")}>
            {text.watchOnYouTube}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        <div role="group" aria-label={text.categoriesLabel} className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const on = filter.key === category
            return (
              <button
                key={filter.key ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(filter.key)}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                  c.focus,
                  on ? c.chipOn : c.chip,
                )}
              >
                {filter.label}
                <span className={cn("tabular-nums", on ? "opacity-70" : "opacity-60")}>{filter.count}</span>
              </button>
            )
          })}
        </div>

        {/* On wide screens the list fills the rest of the player's height and scrolls. */}
        <nav aria-label={text.list} className="relative min-h-0 lg:flex-1">
          <ol className="flex flex-col gap-1 lg:absolute lg:inset-0 lg:overflow-y-auto lg:pr-2">
            {shown.map((item) => {
              const on = item.id === video.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => choose(item.id)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-4 rounded-2xl p-2 text-left transition-colors focus-visible:outline-2",
                      c.focus,
                      on ? c.rowOn : c.row,
                    )}
                  >
                    <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-ink sm:w-32">
                      <Image src={item.thumbnail} alt="" fill placeholder="blur" sizes="128px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block leading-snug font-semibold", on && c.nameOn)}>{item.name[locale]}</span>
                      <span className={cn("mt-0.5 block text-sm", c.meta)}>
                        {on && playing ? text.playing : videoKinds[item.kind][locale]}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </div>
  )
}
