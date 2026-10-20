"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import type { Map as MapLibreMap, Marker } from "maplibre-gl"
import { ArrowUpRight, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { imageryTiles, mapAttribution, mapBounds, mapWorkerPath, terrainTiles } from "@/config/map"
import type mapContent from "@/content/map"
import type { MapPlace, MapPlaceCategory } from "@/lib/api/content"
import type { Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"
import { cn } from "@/lib/utils"

export type MapStrings = (typeof mapContent)["ne"]

export type MapPlaceView = MapPlace & { categoryLabel: string; directionsUrl: string }

type Props = {
  locale: Locale
  places: MapPlaceView[]
  /** The village centre, labelled on the map. */
  village: { latitude: number; longitude: number }
  strings: MapStrings
}

const CATEGORY_COLORS: Record<MapPlaceCategory, string> = {
  sacred: "#b45309",
  school: "#2563eb",
  water: "#0e7490",
  viewpoint: "#7c3aed",
  trail: "#a16207",
  community: "#15803d",
  health: "#dc2626",
  other: "#475569",
}

/** Looking up the valley at the village, tilted enough to read the hills. */
const START = { zoom: 13.8, pitch: 62, bearing: -20 }

type Status = "loading" | "ready" | "unsupported"

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag)
  node.className = className
  if (text) node.textContent = text
  return node
}

/** A pin: a coloured head on a short stem, its foot on the ground. */
function pinElement(place: MapPlaceView) {
  const button = element("button", "village-pin")
  button.type = "button"
  button.style.setProperty("--pin", CATEGORY_COLORS[place.category])
  button.setAttribute("aria-label", `${place.name}, ${place.categoryLabel}`)
  button.append(element("span", "village-pin-head"), element("span", "village-pin-stem"))
  return button
}

/** Popup body, built from text nodes only: names come from the admin. */
function popupElement(place: MapPlaceView, strings: MapStrings) {
  const root = element("div", "village-popup")

  if (place.image_url) {
    const image = element("img", "village-popup-image")
    image.src = place.image_url
    image.alt = ""
    image.loading = "lazy"
    root.append(image)
  }

  const body = element("div", "village-popup-body")
  const category = element("p", "village-popup-category", place.categoryLabel)
  category.style.setProperty("--pin", CATEGORY_COLORS[place.category])
  body.append(category, element("h3", "village-popup-title", place.name))

  if (place.description) body.append(element("p", "village-popup-text", place.description))

  const altitude = element("p", "village-popup-altitude")
  altitude.dataset.altitude = ""
  body.append(altitude)

  const link = element("a", "village-popup-link", `${strings.directions} ↗`)
  link.href = place.directionsUrl
  link.target = "_blank"
  link.rel = "noopener"
  body.append(link)

  root.append(body)
  return root
}

export function VillageMap({ locale, places, village, strings }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markers = useRef(new Map<string, Marker>())
  const [status, setStatus] = useState<Status>("loading")
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const placeMarkers = markers.current

    async function start() {
      if (!supportsWebGL()) {
        setStatus("unsupported")
        return
      }

      const maplibre = await import("maplibre-gl")
      if (cancelled || !container.current) return

      maplibre.setWorkerUrl(`${mapWorkerPath}?v=${maplibre.getVersion()}`)

      const dem = { type: "raster-dem" as const, tiles: [terrainTiles], encoding: "terrarium" as const, tileSize: 256, maxzoom: 14 }

      const map = new maplibre.Map({
        container: container.current,
        style: {
          version: 8,
          sources: {
            imagery: { type: "raster", tiles: [imageryTiles], tileSize: 256, maxzoom: 15, attribution: mapAttribution.imagery },
            terrain: { ...dem, attribution: mapAttribution.terrain },
            hillshade: dem,
          },
          layers: [
            { id: "background", type: "background", paint: { "background-color": "#dfe6dd" } },
            { id: "imagery", type: "raster", source: "imagery" },
            {
              id: "hillshade",
              type: "hillshade",
              source: "hillshade",
              // Shadows only: white highlights wash the imagery out.
              paint: {
                "hillshade-exaggeration": 0.35,
                "hillshade-shadow-color": "#10231a",
                "hillshade-highlight-color": "rgba(255, 255, 255, 0)",
              },
            },
          ],
          terrain: { source: "terrain", exaggeration: 1 },
          sky: {
            "sky-color": "#9cc3e4",
            "horizon-color": "#e9eff3",
            "fog-color": "#e9eff3",
            "sky-horizon-blend": 0.6,
            "horizon-fog-blend": 0.5,
            // Haze only towards the horizon, so the nearby hills stay clear.
            "fog-ground-blend": 0.9,
          },
        },
        center: [village.longitude, village.latitude],
        ...START,
        minZoom: 11,
        maxPitch: 75,
        maxBounds: mapBounds,
        cooperativeGestures: true,
        // The credits are printed under the map; this keeps the button only.
        attributionControl: { compact: true },
        locale: strings.controls,
      })

      mapRef.current = map

      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right")
      map.addControl(new maplibre.FullscreenControl(), "top-right")
      map.addControl(new maplibre.TerrainControl({ source: "terrain", exaggeration: 1 }), "top-right")
      map.addControl(new maplibre.ScaleControl({ unit: "metric" }), "bottom-left")

      new maplibre.Marker({ element: element("div", "village-label", strings.village), anchor: "center" })
        .setLngLat([village.longitude, village.latitude])
        .addTo(map)

      for (const place of places) {
        const popup = new maplibre.Popup({ offset: [0, -40], maxWidth: "18rem", focusAfterOpen: false }).setDOMContent(
          popupElement(place, strings),
        )

        // Height from the terrain under the pin, read when it is shown so
        // the tiles there have loaded. Rounded: the data is not finer.
        popup.on("open", () => {
          const metres = map.queryTerrainElevation([place.longitude, place.latitude])
          const line = popup.getElement()?.querySelector<HTMLElement>("[data-altitude]")
          if (line) {
            line.textContent =
              metres === null ? "" : strings.altitude.replace("{m}", formatNumber(locale, Math.round(metres / 10) * 10))
          }
          setSelected(place.id)
        })
        popup.on("close", () => setSelected((current) => (current === place.id ? null : current)))

        const pin = pinElement(place)
        const marker = new maplibre.Marker({ element: pin, anchor: "bottom" })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(popup)
          .addTo(map)

        placeMarkers.set(place.id, marker)
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
      placeMarkers.clear()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [locale, places, strings, village.latitude, village.longitude])

  function show(place: MapPlaceView) {
    const map = mapRef.current
    if (!map) return

    for (const [id, marker] of markers.current) {
      const open = marker.getPopup()?.isOpen()
      if (open !== (id === place.id)) marker.togglePopup()
    }

    // Skipped for visitors who asked for less motion: flyTo checks that itself.
    map.flyTo({ center: [place.longitude, place.latitude], zoom: 16, pitch: 60, duration: 2200 })
    container.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  function reset() {
    const map = mapRef.current
    if (!map) return

    for (const marker of markers.current.values()) {
      if (marker.getPopup()?.isOpen()) marker.togglePopup()
    }

    setSelected(null)
    map.flyTo({ center: [village.longitude, village.latitude], ...START, duration: 1800 })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
      <div>
        <div className="relative isolate h-[70vh] min-h-[26rem] overflow-hidden rounded-[2rem] bg-mist ring-1 ring-border">
          {/* Sized, not positioned: MapLibre makes its container position: relative. */}
          <div ref={container} className="h-full w-full" />

          {status === "loading" && (
            <p role="status" className="absolute inset-0 grid place-items-center text-muted-foreground">
              {strings.loading}
            </p>
          )}

          {status === "unsupported" && (
            <p role="status" className="absolute inset-0 grid place-items-center p-8 text-center leading-relaxed text-muted-foreground">
              {strings.unsupported}
            </p>
          )}

          {status === "ready" && (
            <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-2">
              <button
                type="button"
                onClick={reset}
                className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-background/95 px-4 text-sm font-medium shadow-md ring-1 ring-black/5 transition-colors hover:bg-background"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                {strings.reset}
              </button>
              <p className="hidden rounded-full bg-ink/70 px-3 py-1.5 text-xs text-ink-foreground backdrop-blur-sm sm:block">{strings.hint}</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{strings.credits}</p>
      </div>

      <aside aria-labelledby="map-places-title">
        <h2 id="map-places-title" className="font-display text-2xl font-semibold">
          {strings.placesTitle}
        </h2>

        {places.length === 0 ? (
          <p className="mt-4 leading-relaxed text-muted-foreground">{strings.noPlaces}</p>
        ) : (
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {places.map((place) => (
              <li key={place.id} className={cn("py-4 transition-colors", selected === place.id && "bg-brand-muted/60")}>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[place.category] }} />
                  {place.categoryLabel}
                </p>
                <p className="mt-1 font-display text-lg font-semibold">{place.name}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                  {status === "ready" && (
                    <button type="button" onClick={() => show(place)} className="text-brand underline-offset-4 hover:underline">
                      {strings.showOnMap}
                    </button>
                  )}
                  <a
                    href={place.directionsUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {strings.directions}
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
