"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import type { Map as MapLibreMap, Marker } from "maplibre-gl"
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"

import { imageryTiles, mapAttribution, mapBounds, mapWorkerPath, terrainTiles } from "@/config/map"
import { formatNumber } from "@/lib/i18n/format"
import { elevationAt } from "@/lib/map/elevation"

import {
  CATEGORY_COLORS,
  MapOverlay,
  supportsWebGL,
  type MapEngineProps,
  type MapHandle,
  type MapPlaceView,
  type MapStatus,
  type MapStrings,
} from "./map-shared"

/**
 * The free map: open satellite imagery (10 m) draped on open elevation data
 * (about 30 m), drawn by MapLibre. Needs no key; shown when the Google 3D
 * view is not configured or Google refuses it.
 */

/** Looking up the valley at the village, tilted enough to read the hills. */
const START = { zoom: 13.8, pitch: 62, bearing: -20 }

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

export function BasicVillageMap({
  locale,
  places,
  village,
  strings,
  onReady,
  onSelect,
  ref,
}: MapEngineProps & { ref?: Ref<MapHandle> }) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markers = useRef(new Map<string, Marker>())
  const [status, setStatus] = useState<MapStatus>("loading")

  // Latest callbacks, so a new function from the parent never rebuilds the map.
  const callbacks = useRef({ onReady, onSelect })
  useEffect(() => {
    callbacks.current = { onReady, onSelect }
  })

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

        popup.on("open", () => {
          callbacks.current.onSelect(place.id, true)
          void elevationAt(place.latitude, place.longitude).then((metres) => {
            const line = popup.getElement()?.querySelector<HTMLElement>("[data-altitude]")
            if (line && metres !== null) {
              line.textContent = strings.altitude.replace("{m}", formatNumber(locale, Math.round(metres / 10) * 10))
            }
          })
        })
        popup.on("close", () => callbacks.current.onSelect(place.id, false))

        const marker = new maplibre.Marker({ element: pinElement(place), anchor: "bottom" })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(popup)
          .addTo(map)

        placeMarkers.set(place.id, marker)
      }

      map.once("load", () => {
        if (cancelled) return
        container.current?.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show")
        setStatus("ready")
        callbacks.current.onReady()
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

  function reset() {
    const map = mapRef.current
    if (!map) return

    for (const marker of markers.current.values()) {
      if (marker.getPopup()?.isOpen()) marker.togglePopup()
    }

    map.flyTo({ center: [village.longitude, village.latitude], ...START, duration: 1800 })
  }

  useImperativeHandle(ref, () => ({
    show(place) {
      const map = mapRef.current
      if (!map) return

      for (const [id, marker] of markers.current) {
        const open = marker.getPopup()?.isOpen()
        if (open !== (id === place.id)) marker.togglePopup()
      }

      // Skipped for visitors who asked for less motion: flyTo checks that itself.
      map.flyTo({ center: [place.longitude, place.latitude], zoom: 16, pitch: 60, duration: 2200 })
    },
    reset,
  }))

  return (
    <>
      {/* Sized, not positioned: MapLibre makes its container position: relative. */}
      <div ref={container} className="h-full w-full" />
      <MapOverlay status={status} strings={strings} hint={strings.hint} onReset={reset} />
    </>
  )
}
