/**
 * Languages of the public site.
 *
 * Nepali first: it is the default for anyone who has not chosen, and the
 * language every page is written in before it is translated. The order and
 * codes match `LanguageChoices` in the backend (`core/choices.py`), so a
 * `?lang=` sent to the API is always one it understands.
 *
 * Client-safe: no dictionaries here, so importing this from a client
 * component costs a few bytes.
 */

export const locales = ["ne", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "ne"

/** Remembers an explicit language choice so `/` returns the visitor to it. */
export const LOCALE_COOKIE = "locale"

/** Each language's name, written in that language. */
export const localeNames: Record<Locale, string> = {
  ne: "नेपाली",
  en: "English",
}

/** Open Graph wants territory-qualified tags. */
export const ogLocales: Record<Locale, string> = {
  ne: "ne_NP",
  en: "en_US",
}

export function isLocale(value: string | null | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "")
}

/** `/about` → `/ne/about`; `/` → `/ne`. Paths are written locale-less. */
export function localizePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

/** `/ne/about/history` → `/about/history`; `/ne` → `/`. */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/")

  if (!isLocale(first)) return pathname

  return rest.length ? `/${rest.join("/")}` : "/"
}

/** The other language. Two locales, so there is exactly one. */
export function otherLocale(locale: Locale): Locale {
  return locale === "ne" ? "en" : "ne"
}
