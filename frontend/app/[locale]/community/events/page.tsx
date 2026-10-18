import { CalendarDays } from "lucide-react"

import { EmptyState, LoadFailed } from "@/components/site/content-ui"
import { EventCard } from "@/components/site/event-card"
import { JsonLd } from "@/components/site/json-ld"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import community from "@/content/community"
import { listEvents } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale].events
  return pageMetadata(locale, "/community/events", t.title, t.lead)
}

/** How many finished events to keep showing; older ones live in the archive. */
const PAST_SHOWN = 12

export default async function EventsPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale]
  const dict = getDictionary(locale)
  const [upcoming, past] = await Promise.all([listEvents(locale, "upcoming"), listEvents(locale, "past")])
  const ok = upcoming.ok && past.ok
  const nothing = upcoming.items.length === 0 && past.items.length === 0

  return (
    <>
      {upcoming.items.length > 0 && (
        <JsonLd
          data={{
            "@type": "ItemList",
            itemListElement: upcoming.items.map((event, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Event",
                name: event.title,
                description: event.description || undefined,
                startDate: event.starts_on,
                endDate: event.ends_on ?? event.starts_on,
                eventStatus: "https://schema.org/EventScheduled",
                eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                location: { "@type": "Place", name: event.location || dict.site.name },
              },
            })),
          }}
        />
      )}

      <PageHero
        crumbs={crumbs(locale, [
          [t.overview.title, "/community"],
          [t.events.title, "/community/events"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.events.title}
        lead={t.events.lead}
      />

      <Section className="pt-12 sm:pt-16">
        {!ok && <LoadFailed message={t.events.loadFailed} />}

        {ok && nothing && (
          <EmptyState
            icon={CalendarDays}
            title={t.events.emptyTitle}
            body={t.events.emptyBody}
            action={{ href: localizePath(locale, "/about/culture"), label: t.events.emptyAction }}
          />
        )}

        {upcoming.items.length > 0 && (
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="font-display text-2xl font-semibold sm:text-3xl">
              {t.events.upcoming}
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {upcoming.items.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} categoryLabel={t.events.categories[event.category]} />
              ))}
            </div>
          </section>
        )}

        {past.items.length > 0 && (
          <section aria-labelledby="past-title" className={upcoming.items.length > 0 ? "mt-20" : undefined}>
            <h2 id="past-title" className="font-display text-2xl font-semibold">
              {t.events.past}
            </h2>
            <div className="mt-6 grid gap-x-10 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">
              {past.items.slice(0, PAST_SHOWN).map((event) => (
                <EventCard key={event.id} event={event} locale={locale} categoryLabel={t.events.categories[event.category]} compact />
              ))}
            </div>
          </section>
        )}
      </Section>
    </>
  )
}
