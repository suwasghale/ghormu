import { timingSafeEqual } from "node:crypto"

import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { localizePath, locales } from "@/lib/i18n/config"

/**
 * Rebuild pages after content changes in the admin.
 *
 * Called by the backend's `revalidate_frontend_paths` Celery task with a
 * shared secret. Paths arrive locale-less (`/updates/village-meeting`) and
 * are rebuilt in every language; tags invalidate every page that read that
 * kind of content.
 *
 * Stale content is never served after a publish (`expire: 0`): an editor
 * who publishes a notice and opens the site should see it, not last
 * version's cache.
 */

const payloadSchema = z.object({
  paths: z.array(z.string().regex(/^\/[a-z0-9/_-]*$/i).max(200)).max(50).default([]),
  tags: z.array(z.string().regex(/^[a-z0-9_-]+$/i).max(64)).max(20).default([]),
})

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET

  if (!expected || !given) return false

  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Revalidation is not configured." }, { status: 503 })
  }

  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 })
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 })
  }

  const { paths, tags } = parsed.data

  for (const tag of tags) revalidateTag(tag, { expire: 0 })

  const rebuilt = paths.flatMap((path) => locales.map((locale) => localizePath(locale, path)))
  for (const path of rebuilt) revalidatePath(path)

  return NextResponse.json({ revalidated: { tags, paths: rebuilt } })
}
