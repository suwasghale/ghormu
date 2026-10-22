import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { Crumb } from "@/components/site/page-hero"
import { photos, type Photo } from "@/content/photos"

import { getDictionary, isLocale, localizePath, locales, ogLocales, type Locale } from "."
import { alternatesFor } from "./metadata"

type Params = Promise<{ locale: string }>

/** The locale of a public page, or a 404 for anything else. */
export async function pageLocale(params: Params): Promise<Locale> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

/** What a shared link shows when the page names no image of its own. */
export const defaultSharePhoto = photos.village

/** A photo's share card: the 1200×630 image with the Ghormu name and credit on it. */
export function shareCard(locale: Locale, photo: Photo) {
  return { url: photo.shareCard, width: 1200, height: 630, alt: photo.alt[locale] }
}

/** Open Graph fields every public page shares. */
export function siteOpenGraph(locale: Locale) {
  return {
    type: "website" as const,
    siteName: getDictionary(locale).site.name,
    locale: ogLocales[locale],
    alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
  }
}

/**
 * How a link to a page looks when shared (WhatsApp, Facebook, X): its
 * title, description and image. `image` is a share card or an uploaded
 * image's address.
 */
export function shareMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  image: { url: string; width?: number; height?: number; alt?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { ...siteOpenGraph(locale), title, description, url: localizePath(locale, path), images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  }
}

/**
 * Title, description, canonical and hreflang for one public page, and how
 * it looks when shared: the card of its hero photo, or the village's.
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  photo: Photo = defaultSharePhoto,
): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    ...shareMetadata(locale, path, title, description, shareCard(locale, photo)),
  }
}

/**
 * Breadcrumbs from home to the current page. `trail` is every step after
 * home as `[label, locale-less path]`; the last one is the page itself.
 */
export function crumbs(locale: Locale, trail: [string, string][]): Crumb[] {
  const home = getDictionary(locale).nav.home
  return [[home, "/"], ...trail].map(([label, path]) => ({ label, href: localizePath(locale, path) }))
}
