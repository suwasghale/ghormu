/**
 * Find every satellite photograph of Ghormu in Esri's World Imagery Wayback
 * archive, and write the list the history page's map uses.
 *
 *     node scripts/historical-imagery.mjs
 *
 * Wayback keeps each past version ("release") of Esri's World Imagery map,
 * from February 2014 on, as ordinary map tiles. Most releases reuse the
 * picture of the one before for any given place, so the script fetches the
 * tile over the village from every release, groups releases whose tile is
 * the same, and asks each group's metadata when and by which satellite the
 * photograph was taken. Releases that only re-processed an older photograph
 * share its capture date and are merged; the newest release of each is kept,
 * since Esri's later processing is usually the cleaner.
 *
 * Run it now and then (a new photograph of Nepal appears every year or
 * two), check the result on the history page, and commit
 * content/historical-imagery.ts.
 */
import { createHash } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const out = path.join(root, "content", "historical-imagery.ts")

/** Over the village: the view the Google Earth link opens on. */
const LATITUDE = 28.0127
const LONGITUDE = 85.2557
/** Zoom 17 is about 1 m per pixel here: fine enough to tell photographs apart. */
const ZOOM = 17

const CONFIG = "https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json"
const TILE = "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile"
const HEADERS = { "User-Agent": "ghormu.com historical imagery list" }

async function get(url, as = "json", attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(45_000) })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return as === "json" ? await response.json() : Buffer.from(await response.arrayBuffer())
    } catch (error) {
      if (attempt === attempts) throw error
    }
  }
}

/** Run `task` over `items`, `width` at a time, keeping their order. */
async function inBatches(items, width, task) {
  const results = []
  for (let start = 0; start < items.length; start += width) {
    results.push(...(await Promise.all(items.slice(start, start + width).map(task))))
  }
  return results
}

const n = 2 ** ZOOM
const column = Math.floor(((LONGITUDE + 180) / 360) * n)
const row = Math.floor(((1 - Math.asinh(Math.tan((LATITUDE * Math.PI) / 180)) / Math.PI) / 2) * n)

const config = await get(CONFIG)
const releases = Object.entries(config)
  .map(([release, item]) => ({
    release: Number(release),
    published: item.itemTitle.match(/(\d{4}-\d{2}-\d{2})/)[1],
    metadata: item.metadataLayerUrl,
  }))
  .sort((a, b) => a.published.localeCompare(b.published))

console.log(`${releases.length} Wayback releases, ${releases[0].published} to ${releases.at(-1).published}`)

const tiles = await inBatches(releases, 8, async (release) => {
  const body = await get(`${TILE}/${release.release}/${ZOOM}/${row}/${column}`, "buffer")
  return createHash("sha1").update(body).digest("hex")
})

// Runs of releases with the same tile: one picture each.
const runs = []
releases.forEach((release, index) => {
  const last = runs.at(-1)
  if (last && last.tile === tiles[index]) last.releases.push(release)
  else runs.push({ tile: tiles[index], releases: [release] })
})

/** The source photograph under the village in one release, at the finest level that has one. */
async function photograph(release) {
  const query = new URLSearchParams({
    geometry: `${LONGITUDE},${LATITUDE}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "SRC_DATE2,NICE_DESC,SRC_DESC,SRC_RES",
    returnGeometry: "false",
    f: "json",
  })
  // Layers 0–8 run from 1.9 cm to 4.8 m per pixel.
  for (let layer = 0; layer <= 8; layer++) {
    const { features = [] } = await get(`${release.metadata}/${layer}/query?${query}`)
    const attributes = features[0]?.attributes
    if (attributes?.SRC_DATE2) {
      return {
        captured: new Date(attributes.SRC_DATE2).toISOString().slice(0, 10),
        source: String(attributes.NICE_DESC || attributes.SRC_DESC || "").trim(),
        resolution: Number(attributes.SRC_RES) || null,
      }
    }
  }
  return null
}

const byCapture = new Map()
for (const run of runs) {
  const found = await photograph(run.releases[0])
  if (!found) {
    console.warn(`No metadata for the picture first published ${run.releases[0].published}; left out.`)
    continue
  }
  // A later re-processing of the same photograph replaces the earlier one.
  const newest = run.releases.at(-1)
  const source = (await photograph(newest))?.source || found.source
  byCapture.set(found.captured, { ...found, source, release: newest.release, published: newest.published })
}

const captures = [...byCapture.values()].sort((a, b) => a.captured.localeCompare(b.captured))

// How far each photograph zooms: older ones stop at 17, and the map enlarges
// their tiles past that instead of asking for tiles that do not exist.
for (const capture of captures) {
  capture.maxZoom = ZOOM
  for (const zoom of [18, 19]) {
    const scale = 2 ** (zoom - ZOOM)
    const response = await fetch(`${TILE}/${capture.release}/${zoom}/${row * scale}/${column * scale}`, { headers: HEADERS, signal: AbortSignal.timeout(45_000) })
    if (!response.ok) break
    capture.maxZoom = zoom
  }
}

for (const capture of captures) {
  console.log(`  ${capture.captured}  ${capture.source.padEnd(14)} ${capture.resolution ?? "?"} m  to zoom ${capture.maxZoom}  (release ${capture.release}, ${capture.published})`)
}

const lines = captures.map(
  (capture) =>
    `  { captured: "${capture.captured}", source: ${JSON.stringify(capture.source)}, resolution: ${capture.resolution}, release: ${capture.release}, maxZoom: ${capture.maxZoom} },`,
)

await writeFile(
  out,
  `/**
 * Satellite photographs of Ghormu in Esri's World Imagery Wayback archive,
 * oldest first: when each was taken, by whose satellite, its detail in
 * metres per pixel, and the Wayback release that shows it.
 *
 * Written by scripts/historical-imagery.mjs on ${new Date().toISOString().slice(0, 10)}. Run it again to pick
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
${lines.join("\n")}
]
`,
  "utf8",
)

console.log(`Wrote ${path.relative(root, out)} with ${captures.length} photographs.`)
