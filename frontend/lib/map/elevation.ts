import { terrainTiles } from "@/config/map"

/**
 * Height above sea level at a point, in metres, read from the same open
 * elevation tiles the free map is built on (mostly SRTM, about 30 m between
 * samples). Used for the "about … m above sea level" line on a place.
 *
 * Google's 3D tiles carry heights too, but above the WGS84 ellipsoid rather
 * than sea level, some tens of metres apart in Nepal; this keeps both maps
 * quoting the same, sea-level figure.
 */

const ZOOM = 14
const TILE = 256

const cache = new Map<string, Promise<number | null>>()

export function elevationAt(latitude: number, longitude: number): Promise<number | null> {
  const key = `${latitude},${longitude}`
  let pending = cache.get(key)

  if (!pending) {
    pending = read(latitude, longitude)
    cache.set(key, pending)
  }

  return pending
}

async function read(latitude: number, longitude: number): Promise<number | null> {
  const scale = 2 ** ZOOM
  const x = ((longitude + 180) / 360) * scale
  const y = ((1 - Math.asinh(Math.tan((latitude * Math.PI) / 180)) / Math.PI) / 2) * scale
  const tileX = Math.floor(x)
  const tileY = Math.floor(y)

  const url = terrainTiles
    .replace("{z}", String(ZOOM))
    .replace("{x}", String(tileX))
    .replace("{y}", String(tileY))

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const bitmap = await createImageBitmap(await response.blob())
    const canvas = document.createElement("canvas")
    canvas.width = TILE
    canvas.height = TILE

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return null

    context.drawImage(bitmap, 0, 0)
    const px = Math.min(TILE - 1, Math.floor((x - tileX) * TILE))
    const py = Math.min(TILE - 1, Math.floor((y - tileY) * TILE))
    const [red, green, blue] = context.getImageData(px, py, 1, 1).data

    // Mapzen "terrarium" encoding.
    return red * 256 + green + blue / 256 - 32768
  } catch {
    return null
  }
}
