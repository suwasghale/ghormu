"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { LostPage } from "@/components/site/lost-page"
import { buttonStyles } from "@/components/site/section"
import { photos } from "@/content/photos"
import en from "@/lib/i18n/dictionaries/en"
import ne from "@/lib/i18n/dictionaries/ne"
import { defaultLocale, isLocale, localizePath, type Locale } from "@/lib/i18n/config"

/** Where to go next: the pages most visitors are looking for. */
const NEXT_STEPS = [
  ["/about", "aboutGhormu"],
  ["/explore/gallery", "gallery"],
  ["/explore/map", "map"],
  ["/contact", "contactUs"],
] as const

function strings(dict: typeof ne) {
  return { ...dict.notFound, links: NEXT_STEPS.map(([path, key]): [string, string] => [path, dict.nav[key]]) }
}

// not-found receives no params, so the locale comes from the URL.
const text: Record<Locale, ReturnType<typeof strings>> = { ne: strings(ne), en: strings(en) }

export default function NotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const t = text[locale]

  return (
    <LostPage
      locale={locale}
      photo={photos.trail}
      code={t.code}
      title={t.title}
      body={t.body}
      elsewhere={t.elsewhere}
      links={t.links}
      actions={
        <Link href={localizePath(locale, "/")} className={buttonStyles.primary}>
          {t.backHome}
        </Link>
      }
    />
  )
}
