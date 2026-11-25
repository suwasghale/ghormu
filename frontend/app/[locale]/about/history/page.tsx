import Link from "next/link"

import { ContentImage } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { ArrowLink, buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { ThroughTimeSection } from "@/components/site/through-time-section"
import archive from "@/content/archive"
import home from "@/content/home"
import { listArchive } from "@/lib/api/content"
import { itemDate } from "@/lib/archive"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale].history
  return pageMetadata(locale, "/about/history", t.title, t.lead, photos.ploughing)
}

export default async function HistoryPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale]
  const ask = home[locale].history
  const dict = getDictionary(locale)
  const { items } = await listArchive(locale)
  const oldest = items.filter((item) => item.year).slice(0, 3)

  return (
    <>
      <PageHero
        photo={{ photo: photos.ploughing, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.about, "/about"],
          [t.history.title, "/about/history"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        title={t.history.title}
        lead={t.history.lead}
      />

      <Section labelledBy="intro-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="intro-title" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.history.introTitle}
          </h2>
          {t.history.intro.map((paragraph) => (
            <p key={paragraph} className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>

        {t.history.timeline.length > 0 && (
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-2xl font-semibold">{t.history.timelineTitle}</h2>
            <ol className="mt-8 border-l-2 border-brand/20">
              {t.history.timeline.map((entry) => (
                <li key={entry.title} className="relative pb-10 pl-8 last:pb-0">
                  <span aria-hidden="true" className="absolute top-1.5 -left-[7px] size-3 rounded-full bg-earth ring-4 ring-background" />
                  <p className="text-sm font-semibold text-earth">{entry.when}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{entry.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{entry.body}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Section>

      <ThroughTimeSection locale={locale} />

      {oldest.length > 0 && (
        <Section labelledBy="archive-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader id="archive-title" title={t.history.fromArchive} />
            <ArrowLink href={localizePath(locale, "/about/archive")}>{t.history.fromArchiveLink}</ArrowLink>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {oldest.map((item) => (
              <li key={item.id}>
                <Link href={localizePath(locale, `/about/archive/${item.slug}`)} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                    <ContentImage src={item.image_url} alt={item.title} className="h-full w-full transition duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-3 text-sm text-earth">{itemDate(locale, item)}</p>
                  <p className="font-display text-lg font-semibold group-hover:text-brand">{item.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section tone="mist" labelledBy="oral-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_6fr] lg:gap-16">
          <div>
            <h2 id="oral-title" className="font-display text-2xl font-bold sm:text-3xl">
              {t.history.oralTitle}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.history.oralBody}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{ask.askTitle}</h3>
            <ol className="mt-4 flex list-decimal flex-col gap-3 pl-6 text-lg leading-snug marker:text-muted-foreground">
              {ask.questions.map((question) => (
                <li key={question} className="pl-1">
                  {question}
                </li>
              ))}
            </ol>
            <p className="mt-6 leading-relaxed text-muted-foreground">{ask.askNote}</p>
            <Link href={`${localizePath(locale, "/contact")}?topic=archive`} className={`${buttonStyles.primary} mt-6`}>
              {t.history.oralCta}
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
