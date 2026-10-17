import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { site } from "@/config/site"

import { JsonLd } from "./json-ld"
import { Landscape } from "./landscape"
import { Container, Eyebrow } from "./section"
import { TopoPattern } from "./topo-pattern"

export type Crumb = { label: string; href: string }

/**
 * Header for every inner page: breadcrumbs, title and a short lead over a
 * contour texture, with a ridgeline at its foot.
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
}: {
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  lead: string
  /** Accessible name for the breadcrumb trail, in the page's language. */
  breadcrumbLabel: string
}) {
  return (
    <header className="relative overflow-hidden bg-mist">
      <TopoPattern className="absolute inset-0 h-full w-full text-brand/10" />
      <Container className="relative pt-10 pb-24 sm:pt-14 sm:pb-32">
        <nav aria-label={breadcrumbLabel}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1
              return (
                <li key={crumb.href} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.href} className="hover:text-brand">
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

        <div className="rise mt-10 max-w-3xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">{lead}</p>
        </div>
      </Container>
      <Landscape variant="strip" className="absolute inset-x-0 bottom-0 h-16 sm:h-24" />

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
