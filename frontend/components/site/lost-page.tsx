import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { Photo } from "@/content/photos"
import type { Locale } from "@/lib/i18n/config"
import { localizePath } from "@/lib/i18n/config"

import { PhotoImage } from "./photo"
import { Container } from "./section"

/**
 * The shared look of the 404 and error pages: a photograph of the village
 * beside a short message, the main way out, and a few places to go next.
 */
export function LostPage({
  locale,
  photo,
  code,
  title,
  body,
  actions,
  elsewhere,
  links,
  children,
}: {
  locale: Locale
  photo: Photo
  code: string
  title: string
  body: string
  /** The main buttons, e.g. try again and back home. */
  actions: React.ReactNode
  /** Heading of the list of other places. */
  elsewhere: string
  /** Locale-less path and its name. */
  links: [string, string][]
  /** Anything else under the message, e.g. an error reference. */
  children?: React.ReactNode
}) {
  return (
    <Container className="py-12 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] lg:order-last lg:aspect-[4/5]">
          <PhotoImage photo={photo} locale={locale} fill sizes="(min-width: 1024px) 45vw, 100vw" />
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-earth">{code}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">{body}</p>
          {children}
          <div className="mt-8 flex flex-wrap gap-3">{actions}</div>

          <nav aria-labelledby="lost-elsewhere" className="mt-12 max-w-md">
            <h2 id="lost-elsewhere" className="text-sm font-semibold tracking-wide text-muted-foreground">
              {elsewhere}
            </h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {links.map(([path, name]) => (
                <li key={path}>
                  <Link href={localizePath(locale, path)} className="group flex items-center justify-between gap-4 py-3.5 font-medium hover:text-brand">
                    {name}
                    <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Container>
  )
}
