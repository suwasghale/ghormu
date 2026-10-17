import type { Metadata } from "next"
import Link from "next/link"

import "./globals.css"
import en from "@/lib/i18n/dictionaries/en"
import ne from "@/lib/i18n/dictionaries/ne"

export const metadata: Metadata = {
  title: `${ne.notFound.title} · ${en.notFound.title} — ${ne.site.name}`,
  robots: { index: false, follow: false },
}

/**
 * 404 for URLs that match no route at all, e.g. `/xyz` or `/fr/about`.
 *
 * The app has two root layouts (`app/[locale]` and `app/(app)`), so there is
 * no single layout to render a 404 inside; Next serves this whole document
 * instead. The URL carries no usable language, so it speaks both.
 */
export default function GlobalNotFound() {
  return (
    <html lang="ne" className="h-full antialiased">
      <body className="flex min-h-full items-center justify-center px-6 py-16">
        <main className="grid w-full max-w-2xl gap-10 text-center sm:grid-cols-2 sm:text-left">
          <section lang="ne">
            <p className="text-sm font-semibold text-muted-foreground">{ne.notFound.code}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{ne.notFound.title}</h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">{ne.notFound.body}</p>
            <Link href="/ne" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-5 font-medium text-brand-foreground">
              {ne.notFound.backHome}
            </Link>
          </section>
          <section lang="en">
            <p className="text-sm font-semibold text-muted-foreground">{en.notFound.code}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{en.notFound.title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{en.notFound.body}</p>
            <Link href="/en" className="mt-6 inline-flex h-11 items-center rounded-full border border-border px-5 font-medium">
              {en.notFound.backHome}
            </Link>
          </section>
        </main>
      </body>
    </html>
  )
}
