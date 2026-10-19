import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { site } from "@/config/site"
import type { Photo } from "@/content/photos"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

import { JsonLd } from "./json-ld"
import { PhotoCredit, PhotoImage } from "./photo"
import { Container, Eyebrow } from "./section"

export type Crumb = { label: string; href: string }

/**
 * Header for every inner page: breadcrumbs, title and a short lead.
 *
 * With a `photo`, the text sits on a darkened photograph of Ghormu, credited
 * in the corner, and the bottom edge curves into the page below. Without
 * one it is quiet on purpose: type on a plain ground, for pages people come
 * to read (policies, notices, help).
 *
 * The last crumb is the page itself. Breadcrumbs are also emitted as
 * BreadcrumbList structured data, which search results show as the path.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  breadcrumbLabel,
  photo,
}: {
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  lead: string
  /** Accessible name for the breadcrumb trail, in the page's language. */
  breadcrumbLabel: string
  photo?: { photo: Photo; locale: Locale }
}) {
  const onPhoto = Boolean(photo)

  return (
    <header className={cn("relative isolate overflow-hidden", onPhoto ? "bg-ink text-ink-foreground" : "border-b border-border bg-snow")}>
      {photo ? (
        <>
          <PhotoImage photo={photo.photo} locale={photo.locale} fill priority sizes="100vw" credit="none" className="-z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/60 via-transparent to-ink/30" />
        </>
      ) : null}

      <Container className={cn("relative pt-10 sm:pt-14", onPhoto ? "pb-32 sm:pb-44" : "pb-16 sm:pb-24")}>
        <nav aria-label={breadcrumbLabel}>
          <ol className={cn("flex flex-wrap items-center gap-1 text-sm", onPhoto ? "text-ink-foreground/70" : "text-muted-foreground")}>
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1
              return (
                <li key={crumb.href} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className={cn("font-medium", onPhoto ? "text-ink-foreground" : "text-foreground")}>
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.href} className={onPhoto ? "hover:text-ink-foreground" : "hover:text-brand"}>
                        {crumb.label}
                      </Link>
                      <ChevronRight aria-hidden="true" className="size-3.5" />
                    </>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <div className={cn("rise max-w-3xl", onPhoto ? "mt-14 sm:mt-20" : "mt-10")}>
          {eyebrow && <Eyebrow tone={onPhoto ? "ink" : "default"}>{eyebrow}</Eyebrow>}
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
            {title}
          </h1>
          <p className={cn("mt-6 text-lg leading-relaxed sm:text-xl", onPhoto ? "text-ink-foreground/85" : "text-muted-foreground")}>
            {lead}
          </p>
        </div>
      </Container>

      {photo ? (
        <>
          <PhotoCredit photo={photo.photo} locale={photo.locale} className="absolute right-4 bottom-16 sm:right-6 sm:bottom-24" />
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 block h-12 w-full sm:h-16">
            <path d="M0 48 Q240 14 480 40 T960 30 T1440 36 V80 H0 Z" fill="var(--background)" />
          </svg>
        </>
      ) : null}

      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: new URL(crumb.href, site.url).toString(),
          })),
        }}
      />
    </header>
  )
}
