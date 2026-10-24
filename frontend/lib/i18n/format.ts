import type { Locale } from "./config"

/**
 * Numbers and times in the page's own script: Nepali pages get Devanagari
 * digits (१८°, ०६:०५), English pages Latin ones. Calendar dates live in
 * ./dates.
 */

export const intlLocale = (locale: Locale) => (locale === "ne" ? "ne-NP" : "en-GB")

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

/** Rupees with South Asian grouping: नेरू २५,००,००० / NPR 25,00,000. */
export function formatRupees(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount)
}
