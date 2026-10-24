"use client"

import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { Photo } from "@/content/photos"
import type { Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"

import { PhotoCredit, PhotoImage } from "./photo"

type Strings = { open: string; close: string; previous: string; next: string; position: string }

/** How far a finger must travel sideways to change photo, in pixels. */
const SWIPE = 50

/**
 * The gallery's photos as a grid; choosing one opens it full screen.
 *
 * The viewer is a native <dialog> opened as a modal: the page behind it is
 * inert, focus stays inside, Escape closes it and focus returns to the
 * photo that opened it. Arrow keys and sideways swipes move between photos.
 */
export function PhotoGallery({ photos, locale, strings }: { photos: Photo[]; locale: Locale; strings: Strings }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const swipeStart = useRef<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)

  const photo = index === null ? null : photos[index]
  const step = (by: number) => setIndex((current) => (current === null ? current : (current + by + photos.length) % photos.length))

  // The page behind does not scroll while a photo is open.
  useEffect(() => {
    if (index === null) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = previous
    }
  }, [index])

  function open(at: number) {
    setIndex(at)
    dialog.current?.showModal()
  }

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((item, at) => (
          <li key={item.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(at)}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <PhotoImage
                photo={item}
                locale={locale}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                credit="none"
                className="transition duration-700 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-14 text-white">
                <span className="text-sm leading-snug opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {item.alt[locale]}
                </span>
                <PhotoCredit photo={item} locale={locale} className="shrink-0 bg-black/30" />
              </span>
              <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <Maximize2 aria-hidden="true" className="size-4" />
                <span className="sr-only">{strings.open}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={photo?.alt[locale]}
        onClose={() => setIndex(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1)
          if (event.key === "ArrowLeft") step(-1)
        }}
        onPointerDown={(event) => {
          swipeStart.current = event.clientX
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null) return
          const moved = event.clientX - swipeStart.current
          swipeStart.current = null
          if (Math.abs(moved) > SWIPE) step(moved < 0 ? 1 : -1)
        }}
        className="photo-viewer m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
      >
        {photo && index !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <p className="text-sm text-white/70 tabular-nums" aria-live="polite">
                {strings.position
                  .replace("{n}", formatNumber(locale, index + 1))
                  .replace("{total}", formatNumber(locale, photos.length))}
              </p>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="grid size-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              >
                <X aria-hidden="true" className="size-6" />
                <span className="sr-only">{strings.close}</span>
              </button>
            </div>

            <div className="relative min-h-0 flex-1 sm:mx-20">
              <PhotoImage key={photo.id} photo={photo} locale={locale} fill sizes="100vw" credit="none" className="object-contain" />
            </div>

            {photos.length > 1 &&
              ([
                [-1, strings.previous, ChevronLeft, "left-2 sm:left-4"],
                [1, strings.next, ChevronRight, "right-2 sm:right-4"],
              ] as const).map(([by, label, Icon, side]) => (
                <button
                  key={by}
                  type="button"
                  onClick={() => step(by)}
                  className={`absolute top-1/2 ${side} grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white`}
                >
                  <Icon aria-hidden="true" className="size-7" />
                  <span className="sr-only">{label}</span>
                </button>
              ))}

            <div className="flex flex-col items-start gap-2 px-4 pt-3 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="max-w-3xl leading-relaxed text-white/85">{photo.alt[locale]}</p>
              <PhotoCredit photo={photo} locale={locale} className="shrink-0 bg-white/10" />
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
