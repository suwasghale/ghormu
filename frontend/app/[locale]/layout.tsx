import type { Metadata } from "next"
import { Mukta, Noto_Serif_Devanagari } from "next/font/google"
import { notFound } from "next/navigation"

import "../globals.css"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { site } from "@/config/site"
import { getDictionary, isLocale, locales, ogLocales } from "@/lib/i18n"

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

/** Only `/ne` and `/en` exist; anything else is a 404, not a render. */
export const dynamicParams = false

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
    openGraph: {
      type: "website",
      siteName: dict.site.name,
      locale: ogLocales[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    },
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
