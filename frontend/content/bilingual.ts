import type { Locale } from "@/lib/i18n/config"

/**
 * Long-form page content, kept apart from the UI dictionaries.
 *
 * Each page's copy lives in `content/<page>.ts` as one object per language.
 * The Nepali object is the source: the English one must have exactly its
 * shape, so a section added in one language fails the build until the other
 * has it too. When the Django CMS arrives, these files are what it replaces.
 */
export type Bilingual<T> = Record<Locale, T>

export function bilingual<T>(content: { ne: T; en: NoInfer<T> }): Bilingual<T> {
  return content
}
