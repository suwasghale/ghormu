/**
 * Draw the PNG app icons from the Ghormu mark.
 *
 *   node scripts/app-icons.mjs
 *
 * Run it after changing the mark below (keep it the same as app/icon.svg).
 * Writes, and all are committed:
 *
 * - public/icons/icon-192.png, icon-512.png: the rounded mark, for the web
 *   app manifest (app/manifest.ts).
 * - public/icons/maskable-512.png: the mark on a full green square with
 *   room around it, for phones that cut icons into their own shapes.
 * - app/apple-icon.png: the same, 180×180, for iPhone and iPad home screens.
 */

import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const sharp = createRequire(join(root, "package.json"))("sharp")

const GREEN = "#1d5c45"
const GLYPH = `<circle cx="22" cy="10" r="3" fill="#f7f4ec" fill-opacity="0.8"/>
  <path d="M4 25 L12 13 L17 20 L20 16 L28 25 Z" fill="#f7f4ec"/>`

/** As app/icon.svg: the mark in a rounded square. */
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${GREEN}"/>
  ${GLYPH}
</svg>`

/** Full-bleed square; the mark kept inside the central 80% safe zone. */
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${GREEN}"/>
  <g transform="translate(4.8 4.8) scale(0.7)">${GLYPH}</g>
</svg>`

const icons = join(root, "public", "icons")
mkdirSync(icons, { recursive: true })

const draw = (svg, size, file) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toFile(file)

await draw(rounded, 192, join(icons, "icon-192.png"))
await draw(rounded, 512, join(icons, "icon-512.png"))
await draw(fullBleed, 512, join(icons, "maskable-512.png"))
await draw(fullBleed, 180, join(root, "app", "apple-icon.png"))

console.log("App icons written.")
