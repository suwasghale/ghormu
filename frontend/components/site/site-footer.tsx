import Link from "next/link"

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

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-border bg-brand-muted/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Link
            href={localizePath(locale, "/")}
            aria-label={dict.header.homeLink}
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <LogoMark />
            <span className="text-xl font-bold tracking-tight">{dict.site.name}</span>
          </Link>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{dict.site.tagline}</p>
        </div>

        {footerColumns.map((column) => (
          <nav key={column.key} aria-labelledby={`footer-${column.key}`}>
            <h2 id={`footer-${column.key}`} className="text-sm font-semibold text-foreground">
              {dict.footer[column.key]}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={hrefFor(locale, link)}
                    className="text-[0.95rem] text-muted-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {dict.nav[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border/80">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <p>{dict.footer.copyright.replace("{year}", formatYear(locale, new Date().getFullYear()))}</p>
          <LanguageSwitcher locale={locale} label={dict.header.switchLanguage} className="bg-background" />
        </div>
      </div>
    </footer>
  )
}
