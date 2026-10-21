import Link from "next/link"
import { connection } from "next/server"

import { LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { MapAccuracy, MapEngineProvider, VillageMap, type MapPlaceView } from "@/components/site/village-map"
import { ghormu } from "@/config/place"
import mapContent from "@/content/map"
import updates from "@/content/updates"
import { listPlaces } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/explore/map", mapContent[locale].title, mapContent[locale].lead)
}

export default async function MapPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = mapContent[locale]
  const dict = getDictionary(locale)

  // Rendered per request so the key is read from the running server's
  // environment, not frozen into the build. The places list is still cached.
  await connection()
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || undefined
  const { items, ok } = await listPlaces(locale)

  const places: MapPlaceView[] = items.map((place) => ({
    ...place,
    categoryLabel: t.categories[place.category] ?? t.categories.other,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
  }))

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
          [dict.nav.map, "/explore/map"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      <MapEngineProvider initial={googleApiKey ? "google" : "basic"}>
        <Section className="pt-10 sm:pt-14">
          {!ok && (
            <div className="mb-6">
              <LoadFailed message={updates[locale].loadFailed} />
            </div>
          )}
          <VillageMap locale={locale} places={places} village={ghormu} strings={t} googleApiKey={googleApiKey} />
        </Section>

        <Section tone="mist" labelledBy="accuracy-title">
          <div className="grid gap-10 lg:grid-cols-[4fr_7fr] lg:gap-20">
            <SectionHeader id="accuracy-title" title={t.accuracy.title} lead={t.accuracy.lead} />
            <div>
              <MapAccuracy google={t.accuracy.google} basic={t.accuracy.basic} always={[t.accuracy.places]} />
              <p className="reveal mt-8 max-w-xl leading-relaxed">{t.accuracy.next}</p>
              <Link href={`${localizePath(locale, "/contact")}?topic=correction`} className={`${buttonStyles.secondary} mt-8`}>
                {t.accuracy.cta}
              </Link>
            </div>
          </div>
        </Section>
      </MapEngineProvider>
    </>
  )
}
