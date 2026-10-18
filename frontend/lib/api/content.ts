import "server-only"

import type { Locale } from "@/lib/i18n/config"

import { API_BASE } from "./server-config"

/**
 * Read-only access to the public content API, for server components.
 *
 * Responses are cached for five minutes and tagged, so a publish in the
 * admin rebuilds the right pages at once (the backend calls
 * /api/revalidate with these tags) and anything missed heals on its own.
 *
 * Nothing here throws. When the API is down, or not running during a
 * build, a list comes back empty with `ok: false`, so a page can say "could
 * not load" rather than "nothing yet", and the next revalidation fills it.
 */

export const CONTENT_REVALIDATE_SECONDS = 300

export const CONTENT_TAGS = {
  posts: "posts",
  events: "events",
  projects: "projects",
  archive: "archive",
} as const

export type Post = {
  id: string
  slug: string
  kind: "news" | "announcement"
  title: string
  summary: string
  image_url: string
  attachment_url: string
  is_pinned: boolean
  published_at: string
}

export type PostDetail = Post & {
  body: string
  updated_at: string
}

export type ContentEvent = {
  id: string
  category: "festival" | "ceremony" | "meeting" | "community" | "sports" | "other"
  title: string
  description: string
  location: string
  starts_on: string
  ends_on: string | null
  image_url: string
}

export type Project = {
  id: string
  stage: "planned" | "ongoing" | "completed"
  title: string
  summary: string
  funding: string
  budget_npr: number | null
  progress: number | null
  started_on: string | null
  completed_on: string | null
  image_url: string
}

export type ArchiveItem = {
  id: string
  slug: string
  kind: "photo" | "document" | "map" | "satellite"
  title: string
  description: string
  year: number | null
  date_label: string
  place: string
  credit: string
  image_url: string
}

export type ListResult<T> = { items: T[]; ok: boolean }

type Query = Record<string, string | undefined>

async function request<T>(path: string, locale: Locale, tags: string[], query: Query = {}): Promise<{ data: T | null; ok: boolean }> {
  const url = new URL(`${API_BASE}/api/v1/content/${path}`)
  url.searchParams.set("lang", locale)

  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value)
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags },
      signal: AbortSignal.timeout(8000),
    })

    if (response.status === 404) return { data: null, ok: true }
    if (!response.ok) return { data: null, ok: false }

    const body = (await response.json()) as { data: T }
    return { data: body.data, ok: true }
  } catch {
    return { data: null, ok: false }
  }
}

async function list<T>(path: string, locale: Locale, tag: string, query: Query = {}): Promise<ListResult<T>> {
  const { data, ok } = await request<{ results: T[] }>(path, locale, [tag], { page_size: "60", ...query })
  return { items: data?.results ?? [], ok }
}

export function listPosts(locale: Locale, kind?: Post["kind"]) {
  return list<Post>("posts/", locale, CONTENT_TAGS.posts, { kind })
}

export async function getPost(locale: Locale, slug: string): Promise<PostDetail | null> {
  return (await request<PostDetail>(`posts/${encodeURIComponent(slug)}/`, locale, [CONTENT_TAGS.posts])).data
}

export function listEvents(locale: Locale, when?: "upcoming" | "past") {
  return list<ContentEvent>("events/", locale, CONTENT_TAGS.events, { when })
}

export function listProjects(locale: Locale) {
  return list<Project>("projects/", locale, CONTENT_TAGS.projects)
}

export function listArchive(locale: Locale, kind?: ArchiveItem["kind"]) {
  return list<ArchiveItem>("archive/", locale, CONTENT_TAGS.archive, { kind })
}

export async function getArchiveItem(locale: Locale, slug: string): Promise<ArchiveItem | null> {
  return (await request<ArchiveItem>(`archive/${encodeURIComponent(slug)}/`, locale, [CONTENT_TAGS.archive])).data
}
