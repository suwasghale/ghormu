"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { RotateCw } from "lucide-react"

import { LostPage } from "@/components/site/lost-page"
import { buttonStyles } from "@/components/site/section"
import { site } from "@/config/site"
import { photos } from "@/content/photos"
import en from "@/lib/i18n/dictionaries/en"
import ne from "@/lib/i18n/dictionaries/ne"
import { defaultLocale, isLocale, localizePath, type Locale } from "@/lib/i18n/config"

const NEXT_STEPS = [
  ["/about", "aboutGhormu"],
  ["/updates", "news"],
  ["/contact", "contactUs"],
] as const

function strings(dict: typeof ne) {
  return {
    ...dict.error,
    elsewhere: dict.notFound.elsewhere,
    links: NEXT_STEPS.map(([path, key]): [string, string] => [path, dict.nav[key]]),
  }
}

const text: Record<Locale, ReturnType<typeof strings>> = { ne: strings(ne), en: strings(en) }

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const t = text[locale]

  useEffect(() => {
    console.error(`[${site.name}]`, error)
  }, [error])

  return (
    <LostPage
      locale={locale}
      photo={photos.terraces}
      code={t.code}
      title={t.title}
      body={t.body}
      elsewhere={t.elsewhere}
      links={t.links}
      actions={
        <>
          <button type="button" onClick={reset} className={buttonStyles.primary}>
            <RotateCw aria-hidden="true" className="size-4" />
            {t.retry}
          </button>
          <Link href={localizePath(locale, "/")} className={buttonStyles.secondary}>
            {t.backHome}
          </Link>
        </>
      }
    >
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {t.reference}: {error.digest}
        </p>
      )}
    </LostPage>
  )
}
