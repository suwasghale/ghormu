import type { Metadata } from "next"
import { Mukta, Noto_Serif_Devanagari } from "next/font/google"
import { notFound } from "next/navigation"

import "../globals.css"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { site } from "@/config/site"
import { photos } from "@/content/photos"
import { getDictionary, isLocale, locales } from "@/lib/i18n"
import { shareCard, siteOpenGraph } from "@/lib/i18n/page"

const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
})

/** Headings only; one variable file covers every weight. */
const notoSerif = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: "variable",
  variable: "--font-noto-serif",
  display: "swap",
})

/**
 * Both languages are built ahead of time. Not `dynamicParams = false`: that
 * setting carries down to every page below, and news stories and archive
 * items have addresses that only exist once an editor publishes them. Any
 * other "locale" is turned away by the `isLocale` checks with a 404.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)

  return {
    metadataBase: new URL(site.url),
    title: { default: `${dict.site.name} — ${dict.site.tagline}`, template: `%s | ${dict.site.name}` },
    description: dict.site.description,
    // No `alternates` here: children would inherit the home page's canonical
    // URL. Each page declares its own with `alternatesFor`.
    // Pages replace this with their own (lib/i18n/page.ts); it covers the rest.
    openGraph: { ...siteOpenGraph(locale), images: [shareCard(locale, photos.village)] },
    twitter: { card: "summary_large_image" },
  }
}

/**
 * Root layout of the public site.
 *
 * A root layout of its own (the account screens have theirs in `app/(app)`)
 * because `<html lang>` must name the page's language for screen readers,
 * hyphenation and search engines, and only a root layout renders `<html>`.
 */
export default async function PublicLayout({ children, params }: LayoutProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)

  return (
    <html lang={locale} data-site="public" className={`${mukta.variable} ${notoSerif.variable} h-full scroll-smooth antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-brand-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {dict.header.skipToContent}
        </a>
        <SiteHeader locale={locale} siteName={dict.site.name} nav={dict.nav} ui={dict.header} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
      </body>
    </html>
  )
}
