import Image from "next/image"

import { creditLine, type Photo } from "@/content/photos"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

/**
 * One of Ghormu's photographs, always with its credit.
 *
 * Served through next/image, so each visitor gets a resized AVIF or WebP
 * for their screen instead of the full file. With `fill`, the parent must
 * be positioned and sized; without it the photo keeps its own proportions.
 */
export function PhotoImage({
  photo,
  locale,
  sizes,
  fill = false,
  priority = false,
  className,
  credit = "overlay",
}: {
  photo: Photo
  locale: Locale
  /** Rendered width hint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string
  fill?: boolean
  priority?: boolean
  className?: string
  /** `overlay`: a small badge in the corner. `none`: shown elsewhere by the caller. */
  credit?: "overlay" | "none"
}) {
  const image = fill ? (
    <Image src={photo.src} alt={photo.alt[locale]} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />
  ) : (
    <Image
      src={photo.src}
      alt={photo.alt[locale]}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  )

  if (credit === "none") return image

  return (
    <>
      {image}
      <PhotoCredit photo={photo} locale={locale} className="absolute right-2 bottom-2" />
    </>
  )
}

/** The small "Photo: …" badge. Place it inside a positioned container. */
export function PhotoCredit({ photo, locale, className }: { photo: Photo; locale: Locale; className?: string }) {
  return (
    <span className={cn("pointer-events-none rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm", className)}>
      {creditLine(locale, photo)}
    </span>
  )
}
