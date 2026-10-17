import type { Locale } from "./config"
import en from "./dictionaries/en"
import ne, { type Dictionary } from "./dictionaries/ne"

export * from "./config"
export type { Dictionary }

const dictionaries: Record<Locale, Dictionary> = { ne, en }

/**
 * The strings for one language.
 *
 * Synchronous because both dictionaries are small. Call it from server
 * components and hand client components only the slice they render, so the
 * translations stay out of the browser bundle.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
