import type { MetadataRoute } from 'next'
import { site } from '@/config/site'
import { localizePath, locales } from '@/lib/i18n/config'

/**
 * Public pages that have real content, locale-less. Placeholder pages stay
 * out until they are written (they are `noindex` meanwhile); add each page
 * here when it replaces its placeholder.
 */
const indexedPaths = ['/']

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
