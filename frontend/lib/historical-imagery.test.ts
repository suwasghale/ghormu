import { describe, expect, it } from "vitest"

import { mapTileOrigins } from "@/config/map"
import { historicalCaptures } from "@/content/historical-imagery"

import { historicalFrames } from "./historical-imagery"

const captures = [
  { captured: "2025-02-21", source: "Vantor", resolution: 0.34, release: 3692, maxZoom: 18 },
  { captured: "2009-01-27", source: "GeoEye", resolution: 1, release: 27946, maxZoom: 17 },
]

describe("Ghormu from above, year by year", () => {
  it("lists the photographs oldest first, each on its own Wayback release", () => {
    const frames = historicalFrames("en", captures)

    expect(frames.map((frame) => frame.yearLabel)).toEqual(["2009", "2025"])
    expect(frames[1].tiles).toBe(
      "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3692/{z}/{y}/{x}",
    )
  })

  it("dates them the way each language writes dates", () => {
    const [, en] = historicalFrames("en", captures)
    expect(en.dateLabel).toBe("21 February 2025")
    expect(en.detail).toBe("Taken: 21 February 2025 · Vantor · about 0.34 m per pixel · Esri World Imagery Wayback")

    // Bikram Sambat first, the satellite company's Gregorian date after it.
    const [, ne] = historicalFrames("ne", captures)
    expect(ne.yearLabel).toBe("२०८१")
    expect(ne.dateLabel).toBe("९ फागुन २०८१ (सन् २०२५ फेब्रुअरी २१)")
  })

  it("credits Esri and the satellite company on the map itself", () => {
    const [geoeye] = historicalFrames("en", captures)
    expect(geoeye.attribution).toContain("Esri World Imagery Wayback")
    expect(geoeye.attribution).toContain("GeoEye 2009")
  })

  it("only loads tiles from a host the security policy allows", () => {
    for (const frame of historicalFrames("en")) {
      expect(mapTileOrigins).toContain(new URL(frame.tiles.replace(/\{[xyz]\}/g, "0")).origin)
    }
  })

  it("has at least two photographs to step between, with distinct dates", () => {
    expect(historicalCaptures.length).toBeGreaterThanOrEqual(2)
    expect(new Set(historicalCaptures.map((capture) => capture.captured)).size).toBe(historicalCaptures.length)
  })
})
