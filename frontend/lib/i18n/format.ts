import type { Locale } from "./config"

/**
 * Numbers, times and dates in the page's own script: Nepali pages get
 * Devanagari digits (१८°, ०६:०५), English pages Latin ones.
 */

const intlLocale = (locale: Locale) => (locale === "ne" ? "ne-NP" : "en-GB")

const DEVANAGARI_DIGITS = "०१२३४५६७८९"

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  const text = new Intl.NumberFormat(intlLocale(locale), options).format(value)
  // Node prints ne-NP in Devanagari; most browsers fall back to Latin digits.
  return locale === "ne" ? text.replace(/[0-9]/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]) : text
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

/** Two local calendar dates as one range, the way each language writes it. */
export function formatDayRange(locale: Locale, from: string, to: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).formatRange(
    new Date(`${from}T00:00:00Z`),
    new Date(`${to}T00:00:00Z`),
  )
}

/** A moment (ISO timestamp) as a date in Nepal time. */
export function formatDate(
  locale: Locale,
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "Asia/Kathmandu" }).format(new Date(iso))
}

/** Rupees with South Asian grouping: नेरू २५,००,००० / NPR 25,00,000. */
export function formatRupees(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount)
}
