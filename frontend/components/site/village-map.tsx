"use client"

import { ArrowUpRight } from "lucide-react"
import { createContext, use, useRef, useState } from "react"

import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

import { BasicVillageMap } from "./map-basic"
import { GoogleVillageMap } from "./map-google"
import { CATEGORY_COLORS, type MapEngineProps, type MapHandle, type MapPlaceView, type MapStrings } from "./map-shared"

export type { MapPlaceView } from "./map-shared"

type Engine = "google" | "basic"

/**
 * Which engine is showing, shared with the accuracy notes further down the
 * page: if Google refuses at runtime, they switch to the free map's notes.
 */
const EngineContext = createContext<{ engine: Engine; setEngine: (engine: Engine) => void } | null>(null)

export function MapEngineProvider({ initial, children }: { initial: Engine; children: React.ReactNode }) {
  const [engine, setEngine] = useState<Engine>(initial)
  return <EngineContext value={{ engine, setEngine }}>{children}</EngineContext>
}

function useEngine() {
  const context = use(EngineContext)
  if (!context) throw new Error("VillageMap needs a MapEngineProvider")
  return context
}

type AccuracyItem = { title: string; body: string }

/** The notes on how accurate the map is, for the engine actually showing. */
export function MapAccuracy({ google, basic, always }: { google: AccuracyItem[]; basic: AccuracyItem[]; always: AccuracyItem[] }) {
  const { engine } = useEngine()

  return (
    <dl className="border-t border-border">
      {[...(engine === "google" ? google : basic), ...always].map((item) => (
        <div key={item.title} className="reveal grid gap-2 border-b border-border py-7 sm:grid-cols-[10rem_1fr] sm:gap-8">
          <dt className="font-display text-xl font-semibold">{item.title}</dt>
          <dd className="leading-relaxed text-muted-foreground">{item.body}</dd>
        </div>
      ))}
    </dl>
  )
}

type Props = {
  locale: Locale
  places: MapPlaceView[]
  village: { latitude: number; longitude: number }
  strings: MapStrings
  /** Shows Google's 3D view when set; the free map otherwise, or if Google refuses. */
  googleApiKey?: string
}

/**
 * The village map with its list of places. Picks the engine: Google 3D when
 * a key is configured, falling back to the free open-data map.
 */
export function VillageMap({ locale, places, village, strings, googleApiKey }: Props) {
  const { engine, setEngine } = useEngine()
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const map = useRef<MapHandle>(null)
  const frame = useRef<HTMLDivElement>(null)

  const engineProps: MapEngineProps = {
    locale,
    places,
    village,
    strings,
    onReady: () => setReady(true),
    onSelect: (id, open) => setSelected((current) => (open ? id : current === id ? null : current)),
  }

  function fallBack() {
    setReady(false)
    setSelected(null)
    setEngine("basic")
  }

  function show(place: MapPlaceView) {
    map.current?.show(place)
    frame.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
      <div>
        <div ref={frame} className="relative isolate h-[70vh] min-h-[26rem] overflow-hidden rounded-[2rem] bg-mist ring-1 ring-border">
          {engine === "google" && googleApiKey ? (
            <GoogleVillageMap key="google" ref={map} apiKey={googleApiKey} onFail={fallBack} {...engineProps} />
          ) : (
            <BasicVillageMap key="basic" ref={map} {...engineProps} />
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {engine === "google" ? strings.googleCredits : strings.credits}
        </p>
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
                  {ready && (
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
