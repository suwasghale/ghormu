/**
 * Save a YouTube video's thumbnail next to the site's other assets, so the
 * songs-and-dances player shows it without asking YouTube for anything until
 * a visitor presses play.
 *
 *     node scripts/video-thumbnails.mjs VIDEO_ID [VIDEO_ID ...]
 *     node scripts/video-thumbnails.mjs VIDEO_ID@2   # a still from the video instead
 *
 * Writes assets/videos/<id>.jpg at 960×540, cropped to the video's 16:9
 * frame. Then add the video to content/videos.ts.
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const out = path.join(root, "assets", "videos")

// Largest first. maxresdefault is missing for some uploads; the others are
// 4:3 with black bars above and below the 16:9 picture, which the crop removes.
const SIZES = ["maxresdefault", "sddefault", "hqdefault"]

async function thumbnail(id, frame) {
  // A still from the video itself (1–3), for an uploaded thumbnail that
  // carries text the site can't show.
  const sizes = frame ? [`maxres${frame}`, `sd${frame}`, `hq${frame}`] : SIZES
  for (const size of sizes) {
    const response = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`)
    if (!response.ok) continue

    const image = sharp(Buffer.from(await response.arrayBuffer()))
    const { width, height } = await image.metadata()
    const frame = Math.round((width * 9) / 16)

    return image
      .extract({ left: 0, top: Math.round((height - frame) / 2), width, height: frame })
      .resize(960, 540, { withoutEnlargement: true, fit: "cover" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
  }
  throw new Error(`No thumbnail found for ${id}`)
}

const ids = process.argv.slice(2)
if (!ids.length) {
  console.error("Usage: node scripts/video-thumbnails.mjs VIDEO_ID [VIDEO_ID ...]")
  process.exit(1)
}

await mkdir(out, { recursive: true })
for (const arg of ids) {
  const [, id, frame] = arg.match(/^([\w-]{11})(?:@([123]))?$/) ?? []
  if (!id) throw new Error(`Not a YouTube video id (optionally @1, @2 or @3): ${arg}`)
  const file = path.join(out, `${id}.jpg`)
  await writeFile(file, await thumbnail(id, frame))
  console.log(path.relative(root, file))
}
