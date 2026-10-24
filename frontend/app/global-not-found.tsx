import type { Metadata } from "next"
import Link from "next/link"

import "./globals.css"
import { PhotoImage } from "@/components/site/photo"
import { buttonStyles } from "@/components/site/section"
import { photos } from "@/content/photos"
import { fontVariables } from "@/lib/fonts"
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
    <html lang="ne" data-site="public" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-snow">
        <main className="flex min-h-full flex-col">
          <div className="relative h-56 shrink-0 sm:h-72">
            <PhotoImage photo={photos.trail} locale="en" fill priority sizes="100vw" />
          </div>

          <div className="mx-auto grid w-full max-w-4xl flex-1 gap-12 px-6 py-14 sm:grid-cols-2 sm:py-20">
            <Link href="/ne" className="flex items-center gap-2.5 font-display text-xl font-semibold sm:col-span-2">
              <svg aria-hidden="true" viewBox="0 0 32 32" className="size-9">
                <rect width="32" height="32" rx="8" fill="#1d5c45" />
                <circle cx="22" cy="10" r="3" fill="#f7f4ec" fillOpacity="0.8" />
                <path d="M4 25 L12 13 L17 20 L20 16 L28 25 Z" fill="#f7f4ec" />
              </svg>
              {ne.site.name}
            </Link>

            {(
              [
                ["ne", ne, "h1", buttonStyles.primary],
                ["en", en, "h2", buttonStyles.secondary],
              ] as const
            ).map(([locale, dict, Heading, button]) => (
              <section key={locale} lang={locale}>
                <p className="text-sm font-semibold tracking-wide text-earth">{dict.notFound.code}</p>
                <Heading className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-balance">{dict.notFound.title}</Heading>
                <p className="mt-4 leading-relaxed text-muted-foreground">{dict.notFound.body}</p>
                <Link href={`/${locale}`} className={`${button} mt-7`}>
                  {dict.notFound.backHome}
                </Link>
              </section>
            ))}
          </div>
        </main>
      </body>
    </html>
  )
}
