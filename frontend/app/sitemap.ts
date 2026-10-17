import type { MetadataRoute } from 'next'
import { site } from '@/config/site'
import { publishedPages } from '@/config/navigation'
import { localizePath, locales } from '@/lib/i18n/config'

/** Only pages with real content; placeholders are `noindex` until written. */
const indexedPaths: readonly string[] = publishedPages

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, site.url).toString()

  return indexedPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: url(localizePath(locale, path)),
      changeFrequency: 'monthly' as const,
      priority: path === '/' ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, url(localizePath(l, path))])) },
    })),
  )
}
