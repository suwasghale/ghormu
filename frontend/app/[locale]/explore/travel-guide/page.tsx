import Link from "next/link"
import {
  ArrowUpRight,
  Banknote,
  BatteryCharging,
  Check,
  Flashlight,
  Footprints,
  GlassWater,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pill,
  Shirt,
  Umbrella,
} from "lucide-react"

import { Faq } from "@/components/site/faq"
import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { WeatherPanel } from "@/components/site/weather-panel"
import { directionsUrl, ghormu, openStreetMapUrl } from "@/config/place"
import { roadNote, roadStatus, type RoadLevel } from "@/content/road-status"
import guide from "@/content/travel-guide"
import { getDictionary, localizePath } from "@/lib/i18n"
import { formatDay, formatNumber } from "@/lib/i18n/format"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"
import { getForecast } from "@/lib/weather"
import { photos } from "@/content/photos"

/** Rebuilt at most every 30 minutes, so the weather stays fresh (matches lib/weather). */
export const revalidate = 1800

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/explore/travel-guide", guide[locale].title, guide[locale].lead)
}

const PACK_ICONS = [Shirt, Umbrella, Footprints, Flashlight, BatteryCharging, Banknote, Pill, GlassWater]

const ROAD_STYLES: Record<RoadLevel, string> = {
  open: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  caution: "bg-amber-100 text-amber-800 ring-amber-600/20",
  closed: "bg-red-100 text-red-800 ring-red-600/20",
  unknown: "bg-muted text-muted-foreground ring-border",
}

export default async function TravelGuidePage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = guide[locale]
  const dict = getDictionary(locale)
  const forecast = await getForecast()
  const coordinate = (value: number) => formatNumber(locale, value, { maximumFractionDigits: 4 })

  return (
    <>
      <PageHero
        photo={{ photo: photos.fields, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
          [t.title, "/explore/travel-guide"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      {/* Live weather */}
      <Section labelledBy="weather-title" className="pt-12 sm:pt-16">
        <div className="reveal">
          <WeatherPanel locale={locale} forecast={forecast} t={t.weather} />
        </div>
      </Section>

      {/* Where it is, and whether the road is open */}
      <Section labelledBy="location-title" className="pt-0 sm:pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal relative isolate overflow-hidden rounded-3xl bg-brand-muted p-8 sm:p-10">
            <MapPin aria-hidden="true" className="size-8 text-earth" />
            <h2 id="location-title" className="mt-5 font-display text-2xl font-semibold sm:text-3xl">
              {t.location.title}
            </h2>
            <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted-foreground">{t.location.body}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {t.location.coordinates}: <span className="font-medium text-foreground">{coordinate(ghormu.latitude)}° N, {coordinate(ghormu.longitude)}° E</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
                <Navigation aria-hidden="true" className="size-4" />
                {t.location.directions}
              </a>
              <a href={openStreetMapUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.secondary, "bg-background/80")}>
                <MapIcon aria-hidden="true" className="size-4" />
                {t.location.openStreetMap}
              </a>
            </div>
          </div>

          <div className="reveal flex flex-col rounded-3xl border border-border p-8 sm:p-10">
            <h2 className="font-display text-2xl font-semibold">{t.road.title}</h2>
            <span className={cn("mt-5 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1", ROAD_STYLES[roadStatus.level])}>
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {t.road.levels[roadStatus.level]}
            </span>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {roadStatus.level === "unknown" ? t.road.unknownBody : roadNote[locale]}
            </p>
            {roadStatus.checked && (
              <p className="mt-auto pt-6 text-sm text-muted-foreground">
                {t.road.checked}: {formatDay(locale, roadStatus.checked, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Getting there */}
      <Section tone="mist" labelledBy="route-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader id="route-title" title={t.route.title} />
            {t.route.steps.length > 0 ? (
              <ol className="reveal mt-8 flex flex-col gap-6">
                {t.route.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-brand-foreground">
                      {formatNumber(locale, index + 1)}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="reveal mt-8 rounded-2xl bg-background p-6 ring-1 ring-border">
                <p className="leading-relaxed text-muted-foreground">{t.route.pending}</p>
                <Link href={localizePath(locale, "/contact")} className="mt-4 inline-flex items-center gap-2 font-semibold text-brand hover:underline">
                  {t.route.contact}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            )}
          </div>
          <div className="reveal lg:pt-16">
            <h3 className="font-display text-xl font-semibold">{t.route.tipsTitle}</h3>
            <ul className="mt-5 flex flex-col gap-4">
              {t.route.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 leading-relaxed">
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* What to bring */}
      <Section labelledBy="pack-title">
        <SectionHeader id="pack-title" title={t.pack.title} lead={t.pack.lead} />
        <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {t.pack.items.map((item, index) => {
            const Icon = PACK_ICONS[index]
            return (
              <li key={item.title} className="reveal rounded-2xl border border-border p-5 sm:p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Stay, and questions */}
      <Section tone="brand" labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="reveal">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t.stay.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.stay.body}</p>
          </div>
          <div className="reveal">
            <h2 id="faq-title" className="font-display text-2xl font-semibold sm:text-3xl">
              {t.faqTitle}
            </h2>
            <div className="mt-6">
              <Faq items={t.faq} />
            </div>
          </div>
        </div>
      </Section>

      <Section labelledBy="cta-title">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 id="cta-title" className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {t.cta.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.cta.body}</p>
          <Link href={localizePath(locale, "/contact")} className={cn(buttonStyles.primary, "mt-9")}>
            {t.cta.button}
          </Link>
        </div>
      </Section>
    </>
  )
}
