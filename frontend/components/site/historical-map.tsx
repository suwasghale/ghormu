"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import type { Map as MapLibreMap } from "maplibre-gl"
import { useEffect, useRef, useState } from "react"

import { mapBounds, mapWorkerPath } from "@/config/map"

import { MapOverlay, supportsWebGL, type MapStatus, type MapStrings } from "./map-shared"
import { TimelineBar, type TimelineStrings } from "./timeline-bar"

/** One satellite photograph of the village, ready to show. */
export type HistoricalFrame = {
  release: number
  tiles: string
  /** The closest zoom Esri has tiles for; the map enlarges them past it. */
  maxZoom: number
  /** The year on the track: २०८१ on Nepali pages, 2025 in English. */
  yearLabel: string
  /** The day it was taken, as the page writes dates. */
  dateLabel: string
  /** Taken when, by whose satellite, how sharp. */
  detail: string
  /** The map's credit line for this photograph. */
  attribution: string
}

export type HistoricalPlace = { id: string; name: string; latitude: number; longitude: number }

/**
 * The opening view: the houses and the primary school, with a little room
 * around them. Fitted to the map's size, so a phone and a wide screen both
 * open on the village rather than the forest beside it.
 */
const VILLAGE: [[number, number], [number, number]] = [
  [85.2495, 28.0085],
  [85.2575, 28.0152],
]
const FIT = { padding: 16 }

const layerId = (frame: HistoricalFrame) => `wayback-${frame.release}`

function label(name: string) {
  const node = document.createElement("div")
  node.className = "history-place"
  node.textContent = name
  return node
}

/**
 * Ghormu seen from above on different dates, like Google Earth's historical
 * imagery: a satellite map to move and zoom, and a timeline of the dates a
 * photograph of the village exists for.
 *
 * Every date is its own tile layer, and only the one on screen is fetched:
 * a visitor who never changes the date downloads one set of tiles.
 */
export function HistoricalMap({
  frames,
  places,
  mapStrings,
  strings,
}: {
  frames: HistoricalFrame[]
  places: HistoricalPlace[]
  mapStrings: MapStrings
  strings: TimelineStrings
}) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [status, setStatus] = useState<MapStatus>("loading")
  // Opens on the newest photograph, the way the village looks now.
  const [index, setIndex] = useState(frames.length - 1)
  const shown = useRef(frames.length - 1)
  const switches = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!supportsWebGL()) {
        setStatus("unsupported")
        return
      }

      const maplibre = await import("maplibre-gl")
      if (cancelled || !container.current) return

      maplibre.setWorkerUrl(`${mapWorkerPath}?v=${maplibre.getVersion()}`)

      const first = shown.current
      const map = new maplibre.Map({
        container: container.current,
        style: {
          version: 8,
          sources: Object.fromEntries(
            frames.map((frame) => [layerId(frame), { type: "raster", tiles: [frame.tiles], tileSize: 256, maxzoom: frame.maxZoom, attribution: frame.attribution }]),
          ),
          layers: [
            { id: "background", type: "background", paint: { "background-color": "#1d2a24" } },
            ...frames.map((frame, i) => ({
              id: layerId(frame),
              type: "raster" as const,
              source: layerId(frame),
              layout: { visibility: i === first ? ("visible" as const) : ("none" as const) },
            })),
          ],
        },
        bounds: VILLAGE,
        fitBoundsOptions: FIT,
        minZoom: 13,
        maxZoom: 19,
        maxBounds: mapBounds,
        // A straight-down view, as Google Earth shows its old imagery.
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        locale: mapStrings.controls,
      })
      map.touchZoomRotate.disableRotation()

      mapRef.current = map
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right")
      map.addControl(new maplibre.FullscreenControl(), "top-right")
      map.addControl(new maplibre.ScaleControl({ unit: "metric" }), "bottom-right")

      for (const place of places) {
        new maplibre.Marker({ element: label(place.name), anchor: "left", offset: [-6, 0] }).setLngLat([place.longitude, place.latitude]).addTo(map)
      }

      map.once("load", () => {
        if (cancelled) return
        container.current?.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show")
        setStatus("ready")
      })
    }

    void start()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [frames, places, mapStrings.controls])

  // Show the chosen date the way Google Earth does: drawn on top at once,
  // its tiles filling in over the earlier picture as each arrives, so there
  // is something to see straight away and never a blank map. The earlier
  // dates stay underneath until the new one is complete, then stop drawing.
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== "ready" || index === shown.current) return

    const turn = ++switches.current
    const next = layerId(frames[index])

    map.setLayoutProperty(next, "visibility", "visible")
    map.moveLayer(next)

    function complete() {
      if (!map || turn !== switches.current) return
      map.off("sourcedata", onData)
      for (const frame of frames) {
        if (layerId(frame) !== next) map.setLayoutProperty(layerId(frame), "visibility", "none")
      }
      shown.current = index
    }

    function onData(event: { sourceId?: string; tile?: unknown }) {
      // Only a tile arriving counts: right after the switch, before any
      // request, a source with nothing loading also reads as loaded.
      if (event.sourceId === next && event.tile && map?.isSourceLoaded(next)) complete()
    }

    map.on("sourcedata", onData)
    return () => {
      map.off("sourcedata", onData)
    }
  }, [index, status, frames])

  function reset() {
    mapRef.current?.fitBounds(VILLAGE, { ...FIT, duration: 1200 })
  }

  const frame = frames[index]

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink sm:aspect-[16/10]">
        {/* Sized, not positioned: MapLibre makes its container position: relative. */}
        <div ref={container} className="h-full w-full" />
        <MapOverlay status={status} strings={mapStrings} hint={mapStrings.hintFlat} onReset={reset} />
        {status === "ready" && (
          <p aria-live="polite" className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-ink/80 px-3 py-1.5 text-ink-foreground backdrop-blur">
            <span className="block font-display text-2xl leading-tight font-bold">{frame.yearLabel}</span>
            <span className="block text-sm text-ink-foreground/85">{frame.dateLabel}</span>
          </p>
        )}
      </div>

      <div className="mt-5">
        <TimelineBar labels={frames.map((item) => item.yearLabel)} index={index} onChange={setIndex} strings={strings} tone="ink" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-foreground/75">{frame.detail}</p>
    </div>
  )
}
