import Link from "next/link"
import { Images } from "lucide-react"

import { ArchiveExplorer } from "@/components/site/archive-explorer"
import { EmptyState, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { ThroughTimeSection } from "@/components/site/through-time-section"
import archive from "@/content/archive"
import { listArchive } from "@/lib/api/content"
import { archiveGroups } from "@/lib/archive"
import { getDictionary, localizePath } from "@/lib/i18n"
import { formatIndex } from "@/lib/i18n/config"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale].archive
  return pageMetadata(locale, "/about/archive", t.title, t.lead)
}

export default async function ArchivePage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listArchive(locale)
  const contribute = `${localizePath(locale, "/contact")}?topic=archive`

  return (
    <>
      <PageHero
        photo={{ photo: photos.flags, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.about, "/about"],
          [t.archive.title, "/about/archive"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.archive.eyebrow}
        title={t.archive.title}
        lead={t.archive.lead}
      />

      <ThroughTimeSection locale={locale} tone="default" />

      <Section labelledBy="collection-title">
        <SectionHeader id="collection-title" title={t.archive.collectionTitle} />
        <div className="mt-8">
          {!ok && <LoadFailed message={t.loadFailed} />}
          {ok && items.length === 0 && (
            <EmptyState
              icon={Images}
              title={t.archive.emptyTitle}
              body={t.archive.emptyBody}
              action={{ href: contribute, label: t.archive.emptyAction }}
            />
          )}
          {items.length > 0 && <ArchiveExplorer groups={archiveGroups(locale, items, t.archive)} strings={t.archive} />}
        </div>
      </Section>

      <Section tone="brand" labelledBy="contribute-title">
        <SectionHeader id="contribute-title" title={t.archive.contributeTitle} />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.archive.steps.map((step, index) => (
            <li key={step.title} className="reveal rounded-2xl bg-background p-6 ring-1 ring-brand/10">
              <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <Link href={contribute} className={`${buttonStyles.primary} reveal mt-10`}>
          {t.archive.contributeCta}
        </Link>
      </Section>
    </>
  )
}
