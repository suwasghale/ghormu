/**
 * Copy the village map's browser files into public/vendor/.
 *
 * - MapLibre looks for its worker next to its own module, which no longer
 *   exists once the app is bundled.
 * - CesiumJS (the Google 3D view) loads its prebuilt script, workers, WASM
 *   decoders and assets from a base URL at runtime; bundling it would add
 *   megabytes to every build for one page.
 *
 * Cesium's prebuilt script carries Knockout (for widgets this site does not
 * use), which finds the global object with `(0,eval)("this")` as it loads.
 * The site's Content-Security-Policy forbids eval, so that one expression is
 * replaced with `globalThis`, which means the same. If a Cesium update
 * changes it, this script fails rather than letting the map break quietly.
 *
 * Runs before `dev` and `build`. The copies are not committed, so they
 * always match the installed versions.
 */

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(join(root, "package.json"))
const vendor = join(root, "public", "vendor")
const packageDir = (name) => dirname(require.resolve(`${name}/package.json`))

mkdirSync(vendor, { recursive: true })

copyFileSync(join(packageDir("maplibre-gl"), "dist", "maplibre-gl-worker.mjs"), join(vendor, "maplibre-gl-worker.mjs"))

const cesiumBuild = join(packageDir("cesium"), "Build", "Cesium")
const cesiumTarget = join(vendor, "cesium")

rmSync(cesiumTarget, { recursive: true, force: true })
for (const part of ["Cesium.js", "Workers", "ThirdParty", "Assets", "Widgets"]) {
  cpSync(join(cesiumBuild, part), join(cesiumTarget, part), { recursive: true })
}

const cesiumScript = join(cesiumTarget, "Cesium.js")
const globalLookup = 'this||(0,eval)("this")'
const source = readFileSync(cesiumScript, "utf8")

if (source.split(globalLookup).length !== 2) {
  throw new Error(`Cesium.js no longer contains exactly one ${globalLookup}: check it still loads under the CSP.`)
}

writeFileSync(cesiumScript, source.replace(globalLookup, "this||globalThis"))
