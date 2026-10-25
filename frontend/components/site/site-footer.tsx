import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"

import { footerColumns, type NavLink } from "@/config/navigation"
import type { Dictionary } from "@/lib/i18n"
import { localizePath, type Locale } from "@/lib/i18n/config"

import { LanguageSwitcher } from "./language-switcher"
import { LogoMark } from "./logo-mark"

function hrefFor(locale: Locale, link: NavLink): string {
  return link.localized === false ? link.href : localizePath(locale, link.href)
}

/** Year in the page's own digits: २०२६ in Nepali, 2026 in English. */
function formatYear(locale: Locale, year: number): string {
  return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en", { useGrouping: false }).format(year)
}

/**
 * Every page ends the same way: a plain invitation to write in or to help,
 * then the site's map. Dark, so it reads as the ground the page stands on.
 */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 border-b border-ink-foreground/10 py-14 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl font-display text-2xl leading-snug font-semibold text-balance sm:text-3xl">{dict.footer.closing}</p>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={localizePath(locale, "/contact")}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-foreground/30 px-6 font-semibold transition-colors hover:border-earth-bright hover:text-earth-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-earth-bright"
            >
              {dict.nav.contactUs}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href={localizePath(locale, "/support")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-earth px-6 font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-earth-bright"
            >
              <Heart aria-hidden="true" className="size-4" />
              {dict.header.support}
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link
              href={localizePath(locale, "/")}
              aria-label={dict.header.homeLink}
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth-bright"
            >
              <LogoMark />
              <span className="font-display text-xl font-bold tracking-tight">{dict.site.name}</span>
            </Link>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-foreground/65">{dict.site.tagline}</p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.key} aria-labelledby={`footer-${column.key}`}>
              <h2 id={`footer-${column.key}`} className="text-sm font-semibold text-ink-foreground">
                {dict.footer[column.key]}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={hrefFor(locale, link)}
                      className="text-[0.95rem] text-ink-foreground/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-earth-bright"
                    >
                      {dict.nav[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-ink-foreground/10 py-6 text-sm text-ink-foreground/55 sm:flex-row sm:items-center">
          <p>{dict.footer.copyright.replace("{year}", formatYear(locale, new Date().getFullYear()))}</p>
          <LanguageSwitcher
            locale={locale}
            label={dict.header.switchLanguage}
            className="border-ink-foreground/20 text-ink-foreground hover:border-earth-bright hover:text-earth-bright focus-visible:outline-earth-bright"
          />
        </div>
      </div>
    </footer>
  )
}
