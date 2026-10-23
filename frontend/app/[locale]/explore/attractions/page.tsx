import { MapPinned, Mountain } from "lucide-react"

import { EmptyState } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { PhotoImage } from "@/components/site/photo"
import { ArrowLink, Section } from "@/components/site/section"
import explore from "@/content/explore-more"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = explore[locale].attractions
  return pageMetadata(locale, "/explore/attractions", t.title, t.lead, photos.forest)
}

export default async function AttractionsPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = explore[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        photo={{ photo: photos.forest, locale }}
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
          [t.attractions.title, "/explore/attractions"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.attractions.title}
        lead={t.attractions.lead}
      />

      <Section className="pt-12 sm:pt-16">
        {t.attractions.places.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.attractions.places.map((place) => (
              <li key={place.name} className="reveal rounded-3xl border border-border p-6">
                <Mountain aria-hidden="true" className="size-6 text-earth" />
                <p className="mt-4 text-sm font-semibold text-brand">{place.kind}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{place.name}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{place.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MapPinned}
            title={t.attractions.emptyTitle}
            body={t.attractions.emptyBody}
            action={{ href: `${localizePath(locale, "/contact")}?topic=travel`, label: t.attractions.emptyAction }}
          />
        )}

        <div className="reveal mt-16 grid overflow-hidden rounded-[2rem] bg-brand text-brand-foreground lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <h2 className="font-display text-3xl font-semibold">{t.attractions.mapTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-foreground/80">{t.attractions.mapBody}</p>
            <ArrowLink href={localizePath(locale, "/explore/map")} tone="ink" className="mt-8 text-brand-foreground focus-visible:outline-brand-foreground">
              {t.attractions.mapLink}
            </ArrowLink>
          </div>
          <div className="relative min-h-80">
            <PhotoImage photo={photos.village} locale={locale} fill sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </Section>
    </>
  )
}
