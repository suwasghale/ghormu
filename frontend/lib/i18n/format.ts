import type { Locale } from "./config"

/**
 * Numbers, times and dates in the page's own script: Nepali pages get
 * Devanagari digits (१८°, ०६:०५), English pages Latin ones.
 */

const intlLocale = (locale: Locale) => (locale === "ne" ? "ne-NP" : "en-GB")

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value)
}

/** `2026-10-17T06:05` (already local time) → `०६:०५` / `06:05`. */
export function formatClock(locale: Locale, localDateTime: string): string {
  const [hours, minutes] = localDateTime.slice(11, 16).split(":").map(Number)
  const two = { minimumIntegerDigits: 2, useGrouping: false }
  return `${formatNumber(locale, hours, two)}:${formatNumber(locale, minutes, two)}`
}

/**
 * Format a local calendar date (`YYYY-MM-DD`). Read as UTC midnight and
 * printed in UTC, so the date never shifts with the server's timezone.
 */
export function formatDay(locale: Locale, localDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).format(new Date(`${localDate}T00:00:00Z`))
}
