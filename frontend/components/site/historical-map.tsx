"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import type { Map as MapLibreMap } from "maplibre-gl"
import { useEffect, useRef, useState } from "react"

import { googleStartView, mapAttribution, mapBounds, mapWorkerPath, terrainTiles } from "@/config/map"
import { cn } from "@/lib/utils"

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

/**
 * The 3D view: the village from the angle the Google Earth link opens on,
 * looking south-south-west across the hillside, tilted 60° from straight
 * down. Heights from open elevation data (about 30 m between samples),
 * slightly raised so the slope reads on a small screen.
 */
const RELIEF = { pitch: 60, bearing: googleStartView.heading, exaggeration: 1.3 }

export type ViewStrings = { label: string; flat: string; relief: string }

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
 * a visitor who never changes the date downloads one set of tiles. In 3D
 * the same photograph is draped over the hills, and can be turned and
 * tilted; the timeline works the same in both.
 */
export function HistoricalMap({
  frames,
  places,
  mapStrings,
  strings,
  viewStrings,
}: {
  frames: HistoricalFrame[]
  places: HistoricalPlace[]
  mapStrings: MapStrings
  strings: TimelineStrings
  viewStrings: ViewStrings
}) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [status, setStatus] = useState<MapStatus>("loading")
  // Opens on the newest photograph, the way the village looks now.
  const [index, setIndex] = useState(frames.length - 1)
  const shown = useRef(frames.length - 1)
  const switches = useRef(0)
  const [relief, setRelief] = useState(false)

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
            [
              ...frames.map((frame) => [layerId(frame), { type: "raster", tiles: [frame.tiles], tileSize: 256, maxzoom: frame.maxZoom, attribution: frame.attribution }]),
              // Fetched only in 3D.
              ["terrain", { type: "raster-dem", tiles: [terrainTiles], encoding: "terrarium", tileSize: 256, maxzoom: 14, attribution: mapAttribution.terrain }],
            ],
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
          // Only drawn once the view is tilted, along the horizon.
          sky: {
            "sky-color": "#9cc3e4",
            "horizon-color": "#e9eff3",
            "fog-color": "#e9eff3",
            "sky-horizon-blend": 0.6,
            "horizon-fog-blend": 0.5,
            "fog-ground-blend": 0.9,
          },
        },
        bounds: VILLAGE,
        fitBoundsOptions: FIT,
        minZoom: 13,
        maxZoom: 19,
        maxBounds: mapBounds,
        maxPitch: 75,
        // Opens straight down, as Google Earth shows its old imagery; turning
        // and tilting are switched on with the 3D view.
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        locale: mapStrings.controls,
      })
      map.touchZoomRotate.disableRotation()
      map.touchPitch.disable()

      mapRef.current = map
      // The compass turns the map back to north, and shows the tilt in 3D.
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right")
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

  // 2D or 3D: drape the photograph over the hills and tilt to the Google
  // Earth angle, or lay it flat and look straight down again.
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== "ready") return

    if (relief) {
      map.setTerrain({ source: "terrain", exaggeration: RELIEF.exaggeration })
      map.dragRotate.enable()
      map.touchZoomRotate.enableRotation()
      map.touchPitch.enable()
      map.easeTo({ ...reliefCamera(map), duration: 1400 })
    } else {
      map.dragRotate.disable()
      map.touchZoomRotate.disableRotation()
      map.touchPitch.disable()
      map.easeTo({ pitch: 0, bearing: 0, duration: 900 })
      map.once("moveend", () => {
        if (!map.getPitch()) map.setTerrain(null)
      })
    }
  }, [relief, status])

  function reset() {
    const map = mapRef.current
    if (!map) return
    if (relief) map.easeTo({ ...reliefCamera(map), duration: 1200 })
    else map.fitBounds(VILLAGE, { ...FIT, duration: 1200 })
  }

  const frame = frames[index]

  return (
    <div>
      {/* A tilted view has no single scale (MapLibre measures at the bottom
          edge, nearest the camera), so the scale bar is shown in 2D only. */}
      <div className={cn("relative aspect-[4/5] overflow-hidden rounded-xl bg-ink sm:aspect-[16/10]", relief && "[&_.maplibregl-ctrl-scale]:hidden")}>
        {/* Sized, not positioned: MapLibre makes its container position: relative. */}
        <div ref={container} className="h-full w-full" />
        <MapOverlay status={status} strings={mapStrings} hint={relief ? mapStrings.hint : mapStrings.hintFlat} onReset={reset} />
        {status === "ready" && (
          <div
            role="group"
            aria-label={viewStrings.label}
            className="absolute top-3 right-14 inline-flex rounded-full bg-background/95 p-1 text-foreground shadow-md ring-1 ring-black/5"
          >
            {([false, true] as const).map((on) => (
              <button
                key={String(on)}
                type="button"
                aria-pressed={relief === on}
                onClick={() => setRelief(on)}
                className={cn(
                  "min-h-8 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  relief === on ? "bg-foreground text-background" : "hover:text-brand",
                )}
              >
                {on ? viewStrings.relief : viewStrings.flat}
              </button>
            ))}
          </div>
        )}
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

/** Where the camera goes for 3D: the village fitted to the map, seen from the Google Earth angle. */
function reliefCamera(map: MapLibreMap) {
  const fitted = map.cameraForBounds(VILLAGE, { ...FIT, bearing: RELIEF.bearing })
  return {
    center: fitted?.center ?? map.getCenter(),
    // A tilted view shows more ground towards the horizon: come in a little.
    zoom: (fitted?.zoom ?? map.getZoom()) + 0.4,
    pitch: RELIEF.pitch,
    bearing: RELIEF.bearing,
  }
}
