import type { ExplorerGroup } from "@/components/site/archive-explorer"
import type { TimeFrame } from "@/components/site/through-time"
import type { ArchiveItem } from "@/lib/api/content"
import { localizePath, type Locale } from "@/lib/i18n/config"
import { formatNumber } from "@/lib/i18n/format"

/** A year in the page's digits, without a thousands separator: २००६, 2006. */
export function yearLabel(locale: Locale, year: number): string {
  return formatNumber(locale, year, { useGrouping: false })
}

/** How an item's date reads: the editor's label if given, else the year. */
export function itemDate(locale: Locale, item: ArchiveItem): string {
  return item.date_label || (item.year ? yearLabel(locale, item.year) : "")
}

/** Satellite items that can go in the "through time" comparison. */
export function timeFrames(locale: Locale, items: ArchiveItem[]): TimeFrame[] {
  return items
    .filter((item) => item.image_url && item.year)
    .map((item) => ({
      id: item.id,
      year: item.year!,
      yearLabel: yearLabel(locale, item.year!),
      title: item.title,
      image: item.image_url,
      credit: item.credit,
    }))
}

/**
 * The collection grouped by decade, oldest first, undated last, with every
 * label written out here on the server (see ArchiveExplorer for why).
 */
export function archiveGroups(
  locale: Locale,
  items: ArchiveItem[],
  labels: { decade: string; undated: string },
): ExplorerGroup[] {
  const groups = new Map<string, ExplorerGroup>()

  for (const item of items) {
    const decade = item.year ? Math.floor(item.year / 10) * 10 : null
    const key = decade === null ? "undated" : String(decade)
    const label = decade === null ? labels.undated : labels.decade.replace("{decade}", yearLabel(locale, decade))

    const group = groups.get(key) ?? { key, label, items: [] }
    group.items.push({ ...item, href: localizePath(locale, `/about/archive/${item.slug}`), dateText: itemDate(locale, item) })
    groups.set(key, group)
  }

  return [...groups.values()].sort((a, b) => (a.key === "undated" ? 1 : b.key === "undated" ? -1 : Number(a.key) - Number(b.key)))
}
