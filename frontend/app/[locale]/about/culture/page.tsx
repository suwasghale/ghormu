import Link from "next/link"
import {
  BookText,
  Drum,
  Flower2,
  Footprints,
  HeartHandshake,
  Home,
  Languages,
  Landmark,
  Music,
  Scissors,
  Shirt,
  Soup,
} from "lucide-react"

import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { TopoPattern } from "@/components/site/topo-pattern"
import culture from "@/content/culture"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/about/culture", culture[locale].title, culture[locale].lead)
}

const RITE_ICONS = [Scissors, Flower2, HeartHandshake]

const HERITAGE_ICONS = [Shirt, Soup, Music, Footprints, Home, Landmark, BookText, Languages]

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
      <Section labelledBy="communities-title">
        <SectionHeader id="communities-title" title={t.communitiesTitle} lead={t.communitiesLead} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.communities.map((community) => (
            <article
              key={community.name}
              className="reveal relative isolate overflow-hidden rounded-3xl bg-brand-muted p-8 sm:p-10"
            >
              <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-brand/15" />
              <Drum aria-hidden="true" className="size-7 text-brand" />
              <h3 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">{community.name}</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{community.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Rites of passage */}
      <Section tone="mist" labelledBy="rites-title">
        <SectionHeader id="rites-title" title={t.ritesTitle} lead={t.ritesLead} />
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {t.rites.map((rite, index) => {
            const Icon = RITE_ICONS[index]
            return (
              <li key={rite.name} className="reveal flex flex-col rounded-2xl bg-background p-7 ring-1 ring-border">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-earth/10 text-earth">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold">{rite.name}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{rite.body}</p>
              </li>
            )
          })}
        </ol>
      </Section>

      {/* Festivals */}
      <Section labelledBy="festivals-title">
        <SectionHeader id="festivals-title" title={t.festivalsTitle} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.festivals.map((festival) => (
            <article key={festival.name} className="reveal border-t-2 border-earth pt-6">
              <h3 className="font-display text-3xl font-semibold">{festival.name}</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{festival.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Living heritage */}
      <Section tone="brand" labelledBy="heritage-title">
        <SectionHeader id="heritage-title" title={t.heritageTitle} lead={t.heritageLead} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.heritage.map((item, index) => {
            const Icon = HERITAGE_ICONS[index]
            return (
              <li key={item.name} className="reveal rounded-2xl bg-background p-6 ring-1 ring-brand/10">
                <Icon aria-hidden="true" className="size-6 text-brand" />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.name}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Contribute */}
      <Section labelledBy="share-title">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 id="share-title" className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {t.cta.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.cta.body}</p>
          <Link href={localizePath(locale, "/contact")} className={`${buttonStyles.primary} mt-9`}>
            {t.cta.button}
          </Link>
        </div>
      </Section>
    </>
  )
}
