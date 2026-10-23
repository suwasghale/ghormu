"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Languages } from "lucide-react"

import {
  LOCALE_COOKIE,
  localeNames,
  localizePath,
  otherLocale,
  stripLocale,
  type Locale,
} from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Link to the same page in the other language.
 *
 * Also remembers the choice, so a later visit to `/` lands in it instead of
 * the Nepali default. The cookie is a preference, not a session: readable by
 * script on purpose, and nothing is lost if it is cleared.
 */
export function LanguageSwitcher({
  locale,
  label,
  className,
  onNavigate,
}: {
  locale: Locale
  /**
   * What the link does, in the current page's language. Read after the
   * visible language name, so the link's spoken name starts with the word on
   * screen (what voice-control users say to press it).
   */
  label: string
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const target = otherLocale(locale)

  return (
    <Link
      href={localizePath(target, stripLocale(pathname))}
      hrefLang={target}
      title={label}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`
        onNavigate?.()
      }}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border px-3.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      <Languages aria-hidden="true" className="size-4" />
      <span lang={target}>{localeNames[target]}</span>
      <span className="sr-only">: {label}</span>
    </Link>
  )
}
