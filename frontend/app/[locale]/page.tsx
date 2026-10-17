import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, MapPin } from "lucide-react"

import { getDictionary, isLocale, localizePath } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return { alternates: alternatesFor(locale, "/") }
}

/** Placeholder home until the designed homepage is brought in. */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-brand-muted to-transparent"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start px-4 py-24 sm:px-6 sm:py-32">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-background px-3 py-1 text-sm font-medium text-brand">
          <MapPin aria-hidden="true" className="size-4" />
          {dict.site.location}
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl">
          {dict.home.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{dict.home.lead}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={localizePath(locale, "/about")}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {dict.home.primaryCta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href={localizePath(locale, "/explore")}
            className="inline-flex h-12 items-center rounded-full border border-border bg-background px-6 font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {dict.home.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  )
}
