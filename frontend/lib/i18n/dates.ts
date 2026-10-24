import NepaliDate from "nepali-date-converter"

import type { Locale } from "./config"
import { formatNumber, intlLocale } from "./format"

/**
 * Calendar dates in the calendar each language's readers live by: Bikram
 * Sambat on Nepali pages (७ कात्तिक २०८३), Gregorian on English ones
 * (24 October 2026). Weekday names are the same in both calendars, so they
 * always come from Intl.
 *
 * Kept apart from ./format so the conversion table (nepali-date-converter)
 * is only loaded by the server components that print dates, never by the
 * client components that format numbers.
 */

/** Month names as written in everyday Nepali, matching the site's own copy. */
const BS_MONTHS = ["वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"] as const

type CalendarDay = { year: number; month: number; day: number }

type DayOptions = Pick<Intl.DateTimeFormatOptions, "day" | "month" | "year" | "weekday">

/** A Gregorian calendar date, `YYYY-MM-DD`, in Bikram Sambat (month 0–11). */
export function toBikramSambat(localDate: string): CalendarDay {
  const [year, month, day] = localDate.split("-").map(Number)
  // Midday UTC falls on the same calendar day in any server time zone.
  const bs = new NepaliDate(new Date(Date.UTC(year, month - 1, day, 12))).getBS()
  return { year: bs.year, month: bs.month, day: bs.date }
}

const numeral = (value: number) => formatNumber("ne", value, { useGrouping: false })

function bikramSambat(date: CalendarDay, options: DayOptions): string {
  const parts = [
    options.day ? numeral(date.day) : null,
    options.month ? BS_MONTHS[date.month] : null,
    options.year ? numeral(date.year) : null,
  ].filter(Boolean)

  return parts.join(" ")
}

const usesCalendar = (options: DayOptions) => Boolean(options.day || options.month || options.year)

function weekday(locale: Locale, localDate: string, style: DayOptions["weekday"]): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: style, timeZone: "UTC" }).format(new Date(`${localDate}T00:00:00Z`))
}

/**
 * Format a local calendar date (`YYYY-MM-DD`). Gregorian dates are read as
 * UTC midnight and printed in UTC, so they never shift with the server's
 * time zone.
 */
export function formatDay(locale: Locale, localDate: string, options: DayOptions): string {
  if (locale === "ne" && usesCalendar(options)) {
    const date = bikramSambat(toBikramSambat(localDate), options)
    return options.weekday ? `${weekday(locale, localDate, options.weekday)}, ${date}` : date
  }

  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).format(new Date(`${localDate}T00:00:00Z`))
}

/** Two local calendar dates as one range, the way each language writes it. */
export function formatDayRange(locale: Locale, from: string, to: string, options: DayOptions): string {
  if (locale !== "ne" || !usesCalendar(options)) {
    return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).formatRange(
      new Date(`${from}T00:00:00Z`),
      new Date(`${to}T00:00:00Z`),
    )
  }

  const start = toBikramSambat(from)
  const end = toBikramSambat(to)
  const year = options.year ? ` ${numeral(end.year)}` : ""

  // ७–९ कात्तिक २०८३
  if (start.year === end.year && start.month === end.month && options.day) {
    return `${numeral(start.day)}–${bikramSambat(end, { ...options, year: undefined })}${year}`
  }

  // २८ असोज – ३ कात्तिक २०८३
  if (start.year === end.year) {
    return `${bikramSambat(start, { ...options, year: undefined })} – ${bikramSambat(end, { ...options, year: undefined })}${year}`
  }

  return `${bikramSambat(start, options)} – ${bikramSambat(end, options)}`
}

/** A moment (ISO timestamp) as a date on the calendar in Nepal. */
export function formatDate(
  locale: Locale,
  iso: string,
  options: DayOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  // en-CA writes YYYY-MM-DD: the Kathmandu calendar day of this moment.
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date(iso))
  return formatDay(locale, localDate, options)
}
