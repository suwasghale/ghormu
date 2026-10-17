import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Hourglass } from "lucide-react"

import { linkedPages } from "@/config/navigation"
import { getDictionary, isLocale, localizePath } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"

/**
 * "Coming soon" for every page the navigation links to that has no route yet.
 *
 * A real page at, say, `app/[locale]/about/history/page.tsx` takes precedence
 * over this catch-all, so pages replace their placeholder one at a time with
 * nothing else to change. Unknown paths are a 404, not a placeholder.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return [...linkedPages.keys()].map((path) => ({ slug: path.slice(1).split("/") }))
}

type PageProps = { params: Promise<{ locale: string; slug: string[] }> }

async function resolve(params: PageProps["params"]) {
  const { locale, slug } = await params
  const path = `/${slug.join("/")}`
  const key = linkedPages.get(path)

  if (!isLocale(locale) || !key) notFound()

  return { locale, path, dict: getDictionary(locale), key }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, path, dict, key } = await resolve(params)

  return {
    title: dict.nav[key],
    alternates: alternatesFor(locale, path),
    // Thin until it has content; keep it out of search results until then.
    robots: { index: false, follow: true },
  }
}

export default async function PlaceholderPage({ params }: PageProps) {
  const { locale, dict, key } = await resolve(params)

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-muted text-brand">
        <Hourglass aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-wide text-brand">{dict.placeholder.status}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{dict.nav[key]}</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{dict.placeholder.body}</p>
      <Link
        href={localizePath(locale, "/")}
        className="mt-10 inline-flex h-12 items-center rounded-full border border-border px-6 font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {dict.placeholder.backHome}
      </Link>
    </section>
  )
}
