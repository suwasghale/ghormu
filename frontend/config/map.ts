/**
 * Where the village map's tiles come from. Both are open data, need no
 * key, and are named in the map's credit line as their licences ask.
 *
 * Terrain: AWS Terrain Tiles (Mapzen "terrarium" encoding), built mostly
 * from SRTM elevation, about 30 m between height samples in Nepal. True to
 * the shape of ridges and valleys; too coarse for terraces or houses.
 *
 * Imagery: Sentinel-2 cloudless 2024 by EOX, 10 m per pixel, licensed
 * CC BY-NC-SA 4.0: free for a non-commercial site like this one. (The 2016
 * edition is CC BY but cloud-covered over Ghormu.) If the site ever earns
 * money from visitors, switch to a paid imagery provider. A drone survey of
 * the village would replace this layer with sharper imagery it owns.
 */

export const terrainTiles = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"

export const imageryTiles = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg"

export const mapAttribution = {
  terrain:
    'Terrain: <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Mapzen, AWS Open Data</a>',
  imagery:
    '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2024)',
}

/** Hosts the map fetches from, for the Content-Security-Policy. */
export const mapTileOrigins = ["https://s3.amazonaws.com", "https://tiles.maps.eox.at"]

/**
 * MapLibre's rendering worker, copied out of node_modules by
 * scripts/copy-map-worker.mjs: once bundled, the library can no longer find
 * the file next to itself.
 */
export const mapWorkerPath = "/vendor/maplibre-gl-worker.mjs"

/** The area the map may pan over: about 15 km around the village. */
export const mapBounds: [[number, number], [number, number]] = [
  [85.17, 27.94],
  [85.34, 28.09],
]
