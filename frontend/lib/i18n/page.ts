import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { Crumb } from "@/components/site/page-hero"

import { getDictionary, isLocale, localizePath, type Locale } from "."
import { alternatesFor } from "./metadata"

type Params = Promise<{ locale: string }>

/** The locale of a public page, or a 404 for anything else. */
export async function pageLocale(params: Params): Promise<Locale> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

/** Title, description, canonical and hreflang for one public page. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title, description, alternates: alternatesFor(locale, path) }
}

/**
 * Breadcrumbs from home to the current page. `trail` is every step after
 * home as `[label, locale-less path]`; the last one is the page itself.
 */
export function crumbs(locale: Locale, trail: [string, string][]): Crumb[] {
  const home = getDictionary(locale).nav.home
  return [[home, "/"], ...trail].map(([label, path]) => ({ label, href: localizePath(locale, path) }))
}
