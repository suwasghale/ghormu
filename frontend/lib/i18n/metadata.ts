import type { Metadata } from "next"

import { defaultLocale, localizePath, locales, type Locale } from "./config"

/**
 * Canonical URL and hreflang alternates for one locale-less path.
 *
 * Search engines use these to treat `/ne/about` and `/en/about` as two
 * languages of one page instead of duplicates, and `x-default` tells them
 * where to send everyone else: Nepali.
 */
export function alternatesFor(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localizePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localizePath(l, path)])),
      "x-default": localizePath(defaultLocale, path),
    },
  }
}
