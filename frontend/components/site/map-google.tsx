"use client"

import type * as CesiumModule from "cesium"
import { ArrowUpRight, X } from "lucide-react"
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"

import { cesiumBaseUrl, googleStartView } from "@/config/map"
import { formatNumber } from "@/lib/i18n/format"
import { elevationAt } from "@/lib/map/elevation"

import {
  CATEGORY_COLORS,
  MapOverlay,
  prefersReducedMotion,
  supportsWebGL,
  type MapEngineProps,
  type MapHandle,
  type MapPlaceView,
  type MapStatus,
} from "./map-shared"

/**
 * The Google 3D view: Google's Photorealistic 3D Tiles (the imagery and
 * ground model of Google Earth) drawn by CesiumJS, with the village's own
 * pins on top.
 *
 * Google's terms ask for its logo and data credits on the map (Cesium's
 * credit display shows both), no caching of its tiles, and no geocoder other
 * than Google's: this map has no search at all.
 *
 * Each page view requests the tileset once, which is what Google bills.
 * When that request fails (no billing, quota used up, bad key) `onFail`
 * hands over to the free map.
 */

type Cesium = typeof CesiumModule

declare global {
  interface Window {
    Cesium?: Cesium
    CESIUM_BASE_URL?: string
  }
}

let loading: Promise<Cesium> | null = null

/** CesiumJS's prebuilt script, loaded on this page only and once. */
function loadCesium(): Promise<Cesium> {
  if (window.Cesium) return Promise.resolve(window.Cesium)

  loading ??= new Promise<Cesium>((resolve, reject) => {
    window.CESIUM_BASE_URL = cesiumBaseUrl

    const style = document.createElement("link")
    style.rel = "stylesheet"
    style.href = `${cesiumBaseUrl}Widgets/CesiumWidget/CesiumWidget.css`
    document.head.append(style)

    const script = document.createElement("script")
    script.src = `${cesiumBaseUrl}Cesium.js`
    script.async = true
    script.onload = () => (window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium did not load")))
    script.onerror = () => {
      loading = null
      reject(new Error("Cesium did not load"))
    }
    document.head.append(script)
  })

  return loading
}

const PIN = { width: 32, height: 44 }

/** The pin as an image: a coloured head ringed in white on a short stem. */
function pinImage(color: string): HTMLCanvasElement {
  const ratio = 2
  const canvas = document.createElement("canvas")
  canvas.width = PIN.width * ratio
  canvas.height = PIN.height * ratio

  const context = canvas.getContext("2d")
  if (!context) return canvas

  context.scale(ratio, ratio)
  const middle = PIN.width / 2

  context.fillStyle = "#ffffff"
  context.fillRect(middle - 1, 26, 2, PIN.height - 26)

  context.shadowColor = "rgba(0, 0, 0, 0.35)"
  context.shadowBlur = 8
  context.shadowOffsetY = 3
  context.beginPath()
  context.arc(middle, 15, 12, 0, Math.PI * 2)
  context.fill()

  context.shadowColor = "transparent"
  context.fillStyle = color
  context.beginPath()
  context.arc(middle, 15, 9, 0, Math.PI * 2)
  context.fill()

  return canvas
}

/** The page's display typeface, for the village name drawn on the map. */
function displayFont(): string {
  return getComputedStyle(document.body).getPropertyValue("--font-display-family").trim() || "Georgia, serif"
}

/** Straight-line distance on the ground, in metres. Good enough at village scale. */
function metresBetween(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRadians = Math.PI / 180
  const x = (b.longitude - a.longitude) * toRadians * Math.cos(((a.latitude + b.latitude) / 2) * toRadians)
  const y = (b.latitude - a.latitude) * toRadians
  return Math.hypot(x, y) * 6_371_000
}

/** How far the camera may wander before it is brought back to the village. */
const LIMIT = { distance: 12_000, height: 12_000 }

export function GoogleVillageMap({
  locale,
  places,
  village,
  strings,
  apiKey,
  onReady,
  onSelect,
  onFail,
  ref,
}: MapEngineProps & { apiKey: string; onFail: () => void; ref?: Ref<MapHandle> }) {
  const container = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<CesiumModule.CesiumWidget | null>(null)
  const [status, setStatus] = useState<MapStatus>("loading")
  const [openId, setOpenId] = useState<string | null>(null)
  const [altitudes, setAltitudes] = useState<Record<string, number | null>>({})

  // Latest callbacks and open place, so the map's own handlers never go stale.
  const callbacks = useRef({ onReady, onSelect, onFail })
  const openRef = useRef<string | null>(null)
  const chooseRef = useRef<(id: string | null) => void>(() => {})
  useEffect(() => {
    callbacks.current = { onReady, onSelect, onFail }
    openRef.current = openId
    chooseRef.current = choose
  })

  /** Open a place's card (or close it, with null), telling the place list. */
  function choose(id: string | null) {
    const previous = openRef.current
    if (previous && previous !== id) callbacks.current.onSelect(previous, false)
    if (id) callbacks.current.onSelect(id, true)
    openRef.current = id
    setOpenId(id)
  }

  useEffect(() => {
    let cancelled = false
    let handler: CesiumModule.ScreenSpaceEventHandler | undefined
    const placeIds = new Set(places.map((place) => place.id))

    async function start() {
      if (!supportsWebGL()) {
        callbacks.current.onFail()
        return
      }

      let Cesium: Cesium
      try {
        Cesium = await loadCesium()
      } catch {
        if (!cancelled) callbacks.current.onFail()
        return
      }
      if (cancelled || !container.current) return

      Cesium.GoogleMaps.defaultApiKey = apiKey

      const widget = new Cesium.CesiumWidget(container.current, {
        baseLayer: false,
        globe: false,
        skyBox: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        showRenderLoopErrors: false,
      })
      widgetRef.current = widget

      const { scene, camera } = widget
      scene.backgroundColor = Cesium.Color.fromCssColorString("#cfdfe9")
      if (scene.skyAtmosphere) scene.skyAtmosphere.show = true
      scene.screenSpaceCameraController.minimumZoomDistance = 60
      scene.screenSpaceCameraController.maximumZoomDistance = 9000

      let tileset: CesiumModule.Cesium3DTileset
      try {
        tileset = await Cesium.createGooglePhotorealistic3DTileset(
          { key: apiKey, onlyUsingWithGoogleGeocoder: true },
          { showCreditsOnScreen: true },
        )
      } catch {
        if (!cancelled) callbacks.current.onFail()
        return
      }
      if (cancelled || widget.isDestroyed()) return

      scene.primitives.add(tileset)
      flyHome(Cesium, widget, 0)

      widget.entities.add({
        position: Cesium.Cartesian3.fromDegrees(village.longitude, village.latitude),
        label: {
          text: strings.village,
          font: `600 16px ${displayFont()}`,
          fillColor: Cesium.Color.fromCssColorString("#0f2a1f"),
          showBackground: true,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.92),
          backgroundPadding: new Cesium.Cartesian2(12, 6),
          heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })

      for (const place of places) {
        widget.entities.add({
          id: place.id,
          name: place.name,
          position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude),
          billboard: {
            image: pinImage(CATEGORY_COLORS[place.category]),
            width: PIN.width,
            height: PIN.height,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
            // Pins stay visible when a ridge stands between them and the camera.
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      }

      const pickedPlace = (position: CesiumModule.Cartesian2) => {
        const picked: unknown = scene.pick(position)
        const id = (picked as { id?: { id?: unknown } } | undefined)?.id?.id
        return typeof id === "string" && placeIds.has(id) ? id : null
      }

      handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
      handler.setInputAction((event: { position: CesiumModule.Cartesian2 }) => {
        chooseRef.current(pickedPlace(event.position))
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
      handler.setInputAction((event: { endPosition: CesiumModule.Cartesian2 }) => {
        scene.canvas.style.cursor = pickedPlace(event.endPosition) ? "pointer" : ""
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      // Only the area around the village: wander too far and the camera comes back.
      camera.moveEnd.addEventListener(() => {
        const position = camera.positionCartographic
        const here = { latitude: Cesium.Math.toDegrees(position.latitude), longitude: Cesium.Math.toDegrees(position.longitude) }
        if (metresBetween(here, googleStartView) > LIMIT.distance || position.height > LIMIT.height) {
          flyHome(Cesium, widget, 1.5)
        }
      })

      const ready = () => {
        if (cancelled) return
        setStatus("ready")
        callbacks.current.onReady()
      }
      tileset.initialTilesLoaded.addEventListener(ready)
      // Slow connections: show the toolbar even if the first tiles take long.
      window.setTimeout(ready, 12_000)
    }

    void start()

    return () => {
      cancelled = true
      handler?.destroy()
      if (widgetRef.current && !widgetRef.current.isDestroyed()) widgetRef.current.destroy()
      widgetRef.current = null
    }
  }, [apiKey, places, strings.village, village.latitude, village.longitude])

  // Altitude of the open place, from the same open elevation data as the free map.
  useEffect(() => {
    const place = places.find((candidate) => candidate.id === openId)
    if (!place || place.id in altitudes) return

    let current = true
    void elevationAt(place.latitude, place.longitude).then((metres) => {
      if (current) setAltitudes((known) => ({ ...known, [place.id]: metres }))
    })
    return () => {
      current = false
    }
  }, [openId, places, altitudes])

  function reset() {
    const widget = widgetRef.current
    if (!widget || !window.Cesium) return

    choose(null)
    flyHome(window.Cesium, widget, prefersReducedMotion() ? 0 : 1.8)
  }

  useImperativeHandle(ref, () => ({
    show(place: MapPlaceView) {
      const widget = widgetRef.current
      const Cesium = window.Cesium
      if (!widget || !Cesium) return

      choose(place.id)

      void elevationAt(place.latitude, place.longitude).then((metres) => {
        if (widget.isDestroyed()) return
        const target = Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, metres ?? googleStartView.height)
        widget.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 40), {
          offset: new Cesium.HeadingPitchRange(widget.camera.heading, Cesium.Math.toRadians(-35), 700),
          duration: prefersReducedMotion() ? 0 : 2.2,
        })
      })
    },
    reset,
  }))

  const open = places.find((place) => place.id === openId)
  const altitude = open ? altitudes[open.id] : undefined

  return (
    <>
      <div ref={container} className="h-full w-full [&_.cesium-widget-credits]:!text-[11px]" />
      <MapOverlay status={status} strings={strings} hint={strings.googleHint} onReset={reset} />

      {open && (
        <div className="absolute bottom-14 left-3 w-[min(20rem,calc(100%-1.5rem))] overflow-hidden rounded-2xl bg-background shadow-xl ring-1 ring-black/5">
          {open.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- an admin upload, already resized
            <img src={open.image_url} alt="" className="aspect-video w-full object-cover" />
          )}
          <div className="p-4">
            <button
              type="button"
              onClick={() => choose(null)}
              aria-label={strings.close}
              className="float-right -mt-1 -mr-1 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[open.category] }} />
              {open.categoryLabel}
            </p>
            <h3 className="mt-1 font-display text-lg leading-snug font-semibold">{open.name}</h3>
            {open.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{open.description}</p>}
            {typeof altitude === "number" && (
              <p className="mt-2 text-sm">{strings.altitude.replace("{m}", formatNumber(locale, Math.round(altitude / 10) * 10))}</p>
            )}
            <a
              href={open.directionsUrl}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              {strings.directions}
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </div>
      )}
    </>
  )
}

/** The view from the village's Google Earth link. */
function flyHome(Cesium: Cesium, widget: CesiumModule.CesiumWidget, duration: number) {
  const { latitude, longitude, height, range, heading, pitch } = googleStartView
  widget.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(longitude, latitude, height), 0), {
    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), range),
    duration,
  })
}
