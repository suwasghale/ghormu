"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { FileQuestion } from "lucide-react"

import en from "@/lib/i18n/dictionaries/en"
import ne from "@/lib/i18n/dictionaries/ne"
import { defaultLocale, isLocale, localizePath } from "@/lib/i18n/config"

// not-found receives no params, so the locale comes from the URL. Only the
// 404 strings reach the browser, not the whole dictionaries.
const strings = { ne: ne.notFound, en: en.notFound }

export default function NotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const t = strings[locale]

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:py-32">
      <span className="inline-flex size-14 items-center justify-center rounded-full border border-border">
        <FileQuestion aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-wide text-muted-foreground">{t.code}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.title}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{t.body}</p>
      <Link
        href={localizePath(locale, "/")}
        className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-6 font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t.backHome}
      </Link>
    </section>
  )
}
