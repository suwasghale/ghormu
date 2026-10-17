"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { site } from "@/config/site"
import en from "@/lib/i18n/dictionaries/en"
import ne from "@/lib/i18n/dictionaries/ne"
import { defaultLocale, isLocale, localizePath } from "@/lib/i18n/config"

const strings = { ne: ne.error, en: en.error }

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const t = strings[locale]

  useEffect(() => {
    console.error(`[${site.name}]`, error)
  }, [error])

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:py-32">
      <span className="inline-flex size-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
        <AlertCircle aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-wide text-red-700">{t.code}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.title}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{t.body}</p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {t.reference}: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t.retry}
        </button>
        <Link
          href={localizePath(locale, "/")}
          className="inline-flex h-12 items-center rounded-full border border-border px-6 font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t.backHome}
        </Link>
      </div>
    </section>
  )
}
