/**
 * Satellite photographs of Ghormu in Esri's World Imagery Wayback archive,
 * oldest first: when each was taken, by whose satellite, its detail in
 * metres per pixel, and the Wayback release that shows it.
 *
 * Written by scripts/historical-imagery.mjs on 2026-11-25. Run it again to pick
 * up new photographs; do not edit by hand.
 */
export type HistoricalCapture = {
  /** The day the photograph was taken (YYYY-MM-DD). */
  captured: string
  /** The satellite company, as Esri credits it. */
  source: string
  /** Metres per pixel. */
  resolution: number | null
  /** The Wayback release whose tiles show this photograph. */
  release: number
  /** The closest zoom level Esri has tiles for. */
  maxZoom: number
}

export const historicalCaptures: HistoricalCapture[] = [
  { captured: "2009-01-27", source: "GeoEye", resolution: 1, release: 27946, maxZoom: 17 },
  { captured: "2013-02-13", source: "DigitalGlobe", resolution: 0.5, release: 18063, maxZoom: 17 },
  { captured: "2017-12-08", source: "Vantor", resolution: 0.46, release: 32246, maxZoom: 18 },
  { captured: "2025-02-21", source: "Vantor", resolution: 0.34, release: 3692, maxZoom: 18 },
]
