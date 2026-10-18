import { getDictionary, localizePath, type Locale } from "."

/** Tabs linking pages that share a navbar group, shown under the page header. */
export function updatesTabs(locale: Locale) {
  const nav = getDictionary(locale).nav
  return [
    { href: localizePath(locale, "/updates"), label: nav.news },
    { href: localizePath(locale, "/updates/announcements"), label: nav.announcements },
    { href: localizePath(locale, "/updates/development"), label: nav.development },
  ]
}
