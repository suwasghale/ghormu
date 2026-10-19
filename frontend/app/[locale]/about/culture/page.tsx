import Link from "next/link"

import { PageHero } from "@/components/site/page-hero"
import { PhotoImage } from "@/components/site/photo"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import culture from "@/content/culture"
import { photos } from "@/content/photos"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/about/culture", culture[locale].title, culture[locale].lead)
}

export default async function CulturePage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = culture[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        photo={{ photo: photos.chorten, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.about, "/about"],
          [t.title, "/about/culture"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      {/* Communities */}
      <Section labelledBy="communities-title" className="py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div className="reveal relative aspect-[4/5] overflow-hidden rounded-[2rem] lg:sticky lg:top-24 lg:self-start">
            <PhotoImage photo={photos.flags} locale={locale} fill sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
          <div>
            <SectionHeader id="communities-title" title={t.communitiesTitle} lead={t.communitiesLead} />
            <div className="mt-12 flex flex-col divide-y divide-border border-y border-border">
              {t.communities.map((community) => (
                <article key={community.name} className="reveal py-8">
                  <h3 className="font-display text-2xl font-semibold sm:text-3xl">{community.name}</h3>
                  <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">{community.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Rites of passage */}
      <Section tone="mist" labelledBy="rites-title">
        <div className="grid gap-10 lg:grid-cols-[4fr_7fr] lg:gap-20">
          <SectionHeader id="rites-title" title={t.ritesTitle} lead={t.ritesLead} />
          <dl className="border-t border-border">
            {t.rites.map((rite) => (
              <div key={rite.name} className="reveal grid gap-2 border-b border-border py-7 sm:grid-cols-[10rem_1fr] sm:gap-8">
                <dt className="font-display text-2xl font-semibold">{rite.name}</dt>
                <dd className="leading-relaxed text-muted-foreground sm:pt-1.5">{rite.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Festivals */}
      <Section labelledBy="festivals-title">
        <SectionHeader id="festivals-title" title={t.festivalsTitle} />
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {t.festivals.map((festival) => (
            <article key={festival.name} className="reveal border-t-2 border-earth pt-6">
              <h3 className="font-display text-3xl font-semibold">{festival.name}</h3>
              <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted-foreground">{festival.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Living heritage */}
      <Section tone="brand" labelledBy="heritage-title">
        <SectionHeader id="heritage-title" title={t.heritageTitle} lead={t.heritageLead} />
        <dl className="mt-12 grid gap-x-12 border-t border-brand/15 md:grid-cols-2">
          {t.heritage.map((item) => (
            <div key={item.name} className="reveal flex flex-col gap-1 border-b border-brand/15 py-6 sm:flex-row sm:gap-6">
              <dt className="font-display text-lg font-semibold sm:w-40 sm:shrink-0">{item.name}</dt>
              <dd className="leading-relaxed text-muted-foreground">{item.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Contribute */}
      <Section labelledBy="share-title" className="py-24 sm:py-32">
        <div className="reveal grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <h2 id="share-title" className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {t.cta.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.cta.body}</p>
          </div>
          <Link href={`${localizePath(locale, "/contact")}?topic=archive`} className={buttonStyles.primary}>
            {t.cta.button}
          </Link>
        </div>
      </Section>
    </>
  )
}
