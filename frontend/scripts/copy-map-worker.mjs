/**
 * Copy MapLibre's worker into public/ so the village map can load it.
 *
 * MapLibre looks for its worker next to its own module, which no longer
 * exists once the app is bundled. Runs before `dev` and `build`; the copy is
 * not committed, so it always matches the installed version.
 */

import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(join(root, "package.json"))

const source = join(dirname(require.resolve("maplibre-gl/package.json")), "dist", "maplibre-gl-worker.mjs")
const target = join(root, "public", "vendor", "maplibre-gl-worker.mjs")

mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
