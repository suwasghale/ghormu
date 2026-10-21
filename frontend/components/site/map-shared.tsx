import { RotateCcw } from "lucide-react"

import type mapContent from "@/content/map"
import type { MapPlace, MapPlaceCategory } from "@/lib/api/content"
import type { Locale } from "@/lib/i18n/config"

/**
 * What the village map's two engines share: the Google 3D view
 * (map-google.tsx) and the free open-data map it falls back to
 * (map-basic.tsx). Both are driven by VillageMap (village-map.tsx).
 */

export type MapStrings = (typeof mapContent)["ne"]

export type MapPlaceView = MapPlace & { categoryLabel: string; directionsUrl: string }

/** What the place list beside the map can ask of either engine. */
export type MapHandle = {
  show: (place: MapPlaceView) => void
  reset: () => void
}

export type MapEngineProps = {
  locale: Locale
  places: MapPlaceView[]
  /** The village centre, labelled on the map. */
  village: { latitude: number; longitude: number }
  strings: MapStrings
  /** The map can take requests from the place list. */
  onReady: () => void
  /** A place was opened on the map, or closed. */
  onSelect: (id: string, open: boolean) => void
}

export const CATEGORY_COLORS: Record<MapPlaceCategory, string> = {
  sacred: "#b45309",
  school: "#2563eb",
  water: "#0e7490",
  viewpoint: "#7c3aed",
  trail: "#a16207",
  community: "#15803d",
  health: "#dc2626",
  other: "#475569",
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export type MapStatus = "loading" | "ready" | "unsupported"

/** What sits over either map: a loading or "cannot open" note, or the toolbar. */
export function MapOverlay({
  status,
  strings,
  hint,
  onReset,
}: {
  status: MapStatus
  strings: MapStrings
  hint: string
  onReset: () => void
}) {
  if (status === "loading") {
    return (
      <p role="status" className="absolute inset-0 grid place-items-center bg-mist text-muted-foreground">
        {strings.loading}
      </p>
    )
  }

  if (status === "unsupported") {
    return (
      <p role="status" className="absolute inset-0 grid place-items-center bg-mist p-8 text-center leading-relaxed text-muted-foreground">
        {strings.unsupported}
      </p>
    )
  }

  return (
    <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-2">
      <button
        type="button"
        onClick={onReset}
        className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-background/95 px-4 text-sm font-medium shadow-md ring-1 ring-black/5 transition-colors hover:bg-background"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        {strings.reset}
      </button>
      <p className="hidden rounded-full bg-ink/70 px-3 py-1.5 text-xs text-ink-foreground backdrop-blur-sm sm:block">{hint}</p>
    </div>
  )
}
