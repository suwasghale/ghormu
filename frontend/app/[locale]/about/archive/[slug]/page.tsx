import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ShieldQuestion } from "lucide-react"

import { ContentImage } from "@/components/site/content-ui"
import { ShareButtons } from "@/components/site/share-buttons"
import { JsonLd } from "@/components/site/json-ld"
import { Container } from "@/components/site/section"
import { site } from "@/config/site"
import archive from "@/content/archive"
import { getArchiveItem } from "@/lib/api/content"
import { itemDate } from "@/lib/archive"
import { getDictionary, localizePath } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"
import { crumbs, defaultSharePhoto, pageLocale, shareCard, shareMetadata } from "@/lib/i18n/page"

/** Rendered on first visit, cached, and rebuilt when the item is edited. */
export const revalidate = 300
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ locale: string; slug: string }> }

async function load(params: PageProps["params"]) {
  const locale = await pageLocale(params)
  const { slug } = await params
  const item = await getArchiveItem(locale, slug)
  if (!item) notFound()
  return { locale, item }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, item } = await load(params)
  const path = `/about/archive/${item.slug}`
  const description = item.description.slice(0, 200) || archive[locale].archive.lead

  return {
    title: item.title,
    description,
    alternates: alternatesFor(locale, path),
    ...shareMetadata(
      locale,
      path,
      item.title,
      description,
      item.image_url ? { url: item.image_url, alt: item.title } : shareCard(locale, defaultSharePhoto),
    ),
  }
}

export default async function ArchiveItemPage({ params }: PageProps) {
  const { locale, item } = await load(params)
  const t = archive[locale]
  const dict = getDictionary(locale)
  const date = itemDate(locale, item)
  const trail = crumbs(locale, [
    [dict.nav.about, "/about"],
    [t.archive.title, "/about/archive"],
    [item.title, `/about/archive/${item.slug}`],
  ])

  const facts = [
    { label: t.item.kind, value: t.archive.kinds[item.kind] },
    { label: t.item.date, value: date },
    { label: t.item.place, value: item.place },
    { label: t.item.credit, value: item.credit },
  ].filter((fact) => fact.value)

  return (
    <>
      <JsonLd
        data={{
          "@type": item.kind === "photo" || item.kind === "satellite" ? "Photograph" : "CreativeWork",
          name: item.title,
          description: item.description || undefined,
          dateCreated: item.year ? String(item.year) : undefined,
          contentLocation: item.place ? { "@type": "Place", name: item.place } : undefined,
          creditText: item.credit || undefined,
          image: item.image_url ? (item.image_url.startsWith("/") ? new URL(item.image_url, site.url).toString() : item.image_url) : undefined,
          inLanguage: locale,
        }}
      />

      <div className="bg-ink text-ink-foreground">
        <Container className="py-8 sm:py-10">
          <nav aria-label={dict.header.breadcrumb}>
            <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-foreground/60">
              {trail.slice(0, -1).map((crumb) => (
                <li key={crumb.href} className="after:mx-1 after:content-['›']">
                  <Link href={crumb.href} className="hover:text-ink-foreground">
                    {crumb.label}
                  </Link>
                </li>
              ))}
              <li aria-current="page" className="text-ink-foreground">
                {item.title}
              </li>
            </ol>
          </nav>
          <div className="mt-8 flex justify-center">
            {item.image_url ? (
              <ContentImage src={item.image_url} alt={item.title} priority className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain" />
            ) : (
              <ContentImage src="" alt="" className="aspect-[16/9] w-full max-w-3xl rounded-2xl" />
            )}
          </div>
        </Container>
      </div>

      <Container className="py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <article>
            {date && <p className="text-sm font-semibold text-earth">{date}</p>}
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{item.title}</h1>
            {item.description && <p className="mt-6 text-lg leading-relaxed whitespace-pre-line text-muted-foreground">{item.description}</p>}
            <ShareButtons
              url={new URL(localizePath(locale, `/about/archive/${item.slug}`), site.url).toString()}
              title={item.title}
              strings={dict.share}
              className="mt-8"
            />
            <Link href={localizePath(locale, "/about/archive")} className="mt-10 inline-flex items-center gap-2 font-semibold text-brand hover:underline">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.item.back}
            </Link>
          </article>

          <aside className="flex flex-col gap-6">
            <dl className="divide-y divide-border rounded-2xl border border-border px-6">
              {facts.map((fact) => (
                <div key={fact.label} className="py-4">
                  <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-2xl bg-muted p-6">
              <ShieldQuestion aria-hidden="true" className="size-6 text-brand" />
              <p className="mt-3 font-semibold">{t.item.removalTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.item.removalBody}</p>
              <Link
                href={`${localizePath(locale, "/contact/feedback")}?topic=correction&about=${encodeURIComponent(item.slug)}`}
                className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
              >
                {t.item.removalCta}
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
