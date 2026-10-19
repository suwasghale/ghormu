import Link from "next/link"
import {
  ArrowUpRight,
  Camera,
  Check,
  CloudRain,
  Flower,
  Footprints,
  HandHeart,
  Landmark,
  Leaf,
  Mountain,
  PartyPopper,
  ShieldAlert,
  Snowflake,
  Trees,
  UtensilsCrossed,
} from "lucide-react"

import { JsonLd } from "@/components/site/json-ld"
import { ArrowLink, Section, SectionHeader } from "@/components/site/section"
import { PageHero } from "@/components/site/page-hero"
import { PhotoImage } from "@/components/site/photo"
import { site } from "@/config/site"
import { photos, type PhotoName } from "@/content/photos"
import tourism from "@/content/tourism"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/explore", tourism[locale].title, tourism[locale].lead)
}

const WHY_ICONS = [Trees, Landmark, Mountain, HandHeart]
const WHY_PHOTOS: PhotoName[] = ["forest", "chorten", "trail", "welcome"]
const SEASON_ICONS = [Flower, CloudRain, Leaf, Snowflake]
const EXPERIENCE_ICONS = [Footprints, Landmark, UtensilsCrossed, PartyPopper, Camera]

export default async function TourismPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = tourism[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <JsonLd
        data={{
          "@type": "TouristDestination",
          name: dict.site.name,
          description: t.lead,
          url: new URL(localizePath(locale, "/explore"), site.url).toString(),
          inLanguage: locale,
        }}
      />
      <PageHero
        photo={{ photo: photos.trail, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      {/* Why visit */}
      <Section labelledBy="why-title">
        <SectionHeader id="why-title" title={t.whyTitle} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.map((item, index) => {
            const Icon = WHY_ICONS[index]
            return (
              <li key={item.title} className="reveal overflow-hidden rounded-2xl border border-border">
                <div className="relative aspect-[4/3]">
                  <PhotoImage photo={photos[WHY_PHOTOS[index]]} locale={locale} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                </div>
                <div className="p-6">
                  <span className="-mt-12 relative inline-flex size-11 items-center justify-center rounded-xl bg-background text-brand shadow-md ring-1 ring-border">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Scenic break: the terraces at work */}
      <div className="relative h-64 overflow-hidden sm:h-[28rem]">
        <PhotoImage photo={photos.terraceWork} locale={locale} fill sizes="100vw" />
      </div>

      {/* Seasons */}
      <Section tone="mist" labelledBy="seasons-title">
        <SectionHeader id="seasons-title" title={t.seasonsTitle} lead={t.seasonsLead} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.seasons.map((season, index) => {
            const Icon = SEASON_ICONS[index]
            return (
              <li
                key={season.name}
                className={cn(
                  "reveal relative flex flex-col rounded-2xl bg-background p-6 ring-1",
                  season.best ? "ring-2 ring-brand" : "ring-border",
                )}
              >
                {season.best && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-brand-foreground">
                    {t.recommended}
                  </span>
                )}
                <Icon aria-hidden="true" className="size-6 text-earth" />
                <h3 className="mt-4 font-display text-2xl font-semibold">{season.name}</h3>
                <p className="mt-1 text-sm font-medium text-brand">{season.months}</p>
                <p className="mt-3 leading-relaxed text-muted-foreground">{season.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Things to do */}
      <Section labelledBy="experiences-title">
        <SectionHeader id="experiences-title" title={t.experiencesTitle} />
        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {t.experiences.map((item, index) => {
            const Icon = EXPERIENCE_ICONS[index]
            return (
              <li key={item.title} className="reveal flex gap-4">
                <Icon aria-hidden="true" className="mt-1 size-6 shrink-0 text-brand" />
                <div>
                  <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Responsible travel and safety */}
      <Section tone="brand" labelledBy="tips-title">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal rounded-3xl bg-background p-8 ring-1 ring-brand/10 sm:p-10">
            <h2 id="tips-title" className="font-display text-2xl font-semibold sm:text-3xl">
              {t.tipsTitle}
            </h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              {t.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 leading-relaxed">
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-3xl bg-ink p-8 text-ink-foreground sm:p-10">
            <ShieldAlert aria-hidden="true" className="size-7 text-earth" />
            <h2 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{t.safetyTitle}</h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              {t.safety.map((item) => (
                <li key={item} className="flex items-start gap-3 leading-relaxed text-ink-foreground/85">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-earth" />
                  {item}
                </li>
              ))}
            </ul>
            <ArrowLink href={localizePath(locale, "/contact/emergency")} tone="ink" className="mt-8">
              {t.emergencyLink}
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* Plan your trip */}
      <Section labelledBy="more-title">
        <SectionHeader id="more-title" title={t.moreTitle} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.more.map((item) => (
            <li key={item.href} className="reveal">
              <Link
                href={localizePath(locale, item.href)}
                className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-border p-6 transition hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span>
                  <span className="block font-display text-xl font-semibold">{item.title}</span>
                  <span className="mt-2 block leading-relaxed text-muted-foreground">{item.body}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="size-5 text-brand transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
