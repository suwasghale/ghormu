import type { HistoricalFrame } from "@/components/site/historical-map"
import { waybackAttribution, waybackTiles } from "@/config/map"
import archive from "@/content/archive"
import { historicalCaptures, type HistoricalCapture } from "@/content/historical-imagery"
import type { Locale } from "@/lib/i18n/config"
import { formatDay } from "@/lib/i18n/dates"
import { formatNumber, intlLocale } from "@/lib/i18n/format"

/** The day in the Gregorian calendar, in the page's language and digits. */
function gregorian(locale: Locale, day: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  )
}

/**
 * Each satellite photograph of the village as the history page shows it.
 * Nepali pages give the Bikram Sambat date first and the Gregorian one in
 * brackets, since the satellite companies date by the latter.
 */
export function historicalFrames(locale: Locale, captures: HistoricalCapture[] = historicalCaptures): HistoricalFrame[] {
  const t = archive[locale].historyMap

  return [...captures]
    .sort((a, b) => a.captured.localeCompare(b.captured))
    .map((capture) => {
      const day = formatDay(locale, capture.captured, { day: "numeric", month: "long", year: "numeric" })
      const dateLabel = locale === "ne" ? `${day} (सन् ${gregorian(locale, capture.captured)})` : day
      const sharpness = capture.resolution ? t.perPixel.replace("{m}", formatNumber(locale, capture.resolution)) : null

      return {
        release: capture.release,
        tiles: waybackTiles(capture.release),
        maxZoom: capture.maxZoom,
        yearLabel: formatDay(locale, capture.captured, { year: "numeric" }),
        dateLabel,
        detail: [`${t.taken}: ${dateLabel}`, capture.source, sharpness, t.credit].filter(Boolean).join(" · "),
        attribution: `${waybackAttribution} · ${capture.source} ${capture.captured.slice(0, 4)}`,
      }
    })
}
