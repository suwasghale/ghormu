import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { EventCard } from "@/components/site/event-card"
import { PageHero } from "@/components/site/page-hero"
import { ArrowLink, buttonStyles, Section, SectionHeader } from "@/components/site/section"
import community from "@/content/community"
import { listEvents } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"
import { photos } from "@/content/photos"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale].overview
  return pageMetadata(locale, "/community", t.title, t.lead, photos.hillsideChildren)
}

export default async function CommunityPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale]
  const dict = getDictionary(locale)
  const { items: upcoming } = await listEvents(locale, "upcoming")

  return (
    <>
      <PageHero
        photo={{ photo: photos.hillsideChildren, locale }}
        crumbs={crumbs(locale, [[t.overview.title, "/community"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        title={t.overview.title}
        lead={t.overview.lead}
      />

      {/* One village, many communities */}
      <Section labelledBy="intro-title">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="reveal">
            <h2 id="intro-title" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.overview.introTitle}
            </h2>
            {t.overview.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="reveal">
            <h3 className="text-sm font-semibold text-muted-foreground">{t.overview.surnamesTitle}</h3>
            <ul className="mt-4 flex flex-wrap gap-3">
              {t.surnames.clans.map((clan) => (
                <li key={clan.name} className="rounded-full bg-brand-muted px-5 py-2.5 font-display text-xl font-semibold text-brand">
                  {clan.name}
                </li>
              ))}
            </ul>
            <ArrowLink href={localizePath(locale, "/community/surnames")} className="mt-6">
              {t.overview.surnamesLink}
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* The portal */}
      <section aria-labelledby="portal-title" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeader id="portal-title" tone="ink" title={t.overview.portalTitle} lead={t.overview.portalLead} />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-ink-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.overview.features.map((feature) => (
              <li key={feature.title} className="reveal bg-ink p-7">
                <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-foreground/70">{feature.body}</p>
              </li>
            ))}
          </ul>
          <div className="reveal mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/login" className={buttonStyles.onInk}>
              {t.overview.portalCta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <p className="text-sm text-ink-foreground/60">{t.overview.portalNote}</p>
          </div>
        </div>
      </section>

      {/* Coming up */}
      {upcoming.length > 0 && (
        <Section labelledBy="events-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader id="events-title" title={t.overview.eventsTitle} />
            <ArrowLink href={localizePath(locale, "/community/events")}>{t.overview.eventsLink}</ArrowLink>
          </div>
          <div className={cn("mt-8 grid gap-4", upcoming.length > 1 && "lg:grid-cols-2")}>
            {upcoming.slice(0, 2).map((event) => (
              <EventCard key={event.id} event={event} locale={locale} categoryLabel={t.events.categories[event.category]} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
