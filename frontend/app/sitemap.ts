import type { MetadataRoute } from 'next'
import { publishedPages } from '@/config/navigation'
import { site } from '@/config/site'
import { listArchive, listPosts } from '@/lib/api/content'
import { localizePath, locales } from '@/lib/i18n/config'

/** Rebuilt with the content it lists; publishing also refreshes it via tags. */
export const revalidate = 300

/**
 * Every page with real content, in both languages: the fixed pages, plus
 * each published news story and archive item. Placeholder pages stay out
 * (they are `noindex` until written).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, site.url).toString()

  const entry = (path: string, priority: number, lastModified?: string) =>
    locales.map((locale) => ({
      url: url(localizePath(locale, path)),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, url(localizePath(l, path))])) },
    }))

  // Slugs are the same in every language, so one language's lists suffice.
  const [posts, archive] = await Promise.all([listPosts('ne'), listArchive('ne')])

  return [
    ...publishedPages.flatMap((path) => entry(path, path === '/' ? 1 : 0.7)),
    ...posts.items.flatMap((post) => entry(`/updates/${post.slug}`, 0.6, post.published_at)),
    ...archive.items.flatMap((item) => entry(`/about/archive/${item.slug}`, 0.5)),
  ]
}
