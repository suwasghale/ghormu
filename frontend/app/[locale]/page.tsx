import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { EventCard } from "@/components/site/event-card"
import { JsonLd } from "@/components/site/json-ld"
import { PhotoCredit, PhotoImage } from "@/components/site/photo"
import { PostCard } from "@/components/site/post-card"
import { VideoPlayer } from "@/components/site/video-player"
import { ArrowLink, buttonStyles, Container, Section } from "@/components/site/section"
import { site } from "@/config/site"
import community from "@/content/community"
import home from "@/content/home"
import { photos, type PhotoName } from "@/content/photos"
import tourism from "@/content/tourism"
import { videos, videoText } from "@/content/videos"
import { listEvents, listPosts } from "@/lib/api/content"
import { getDictionary, isLocale, localizePath, locales } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"
import { shareCard, shareMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"

/** Static, but refreshed when news or events are published (see lib/api/content). */
export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const { site } = getDictionary(locale)
  const description = home[locale].meta.description

  return {
    description,
    alternates: alternatesFor(locale, "/"),
    ...shareMetadata(locale, "/", `${site.name} — ${site.tagline}`, description, shareCard(locale, photos.village)),
  }
}

/** "A day in Ghormu", in order. */
const DAY: PhotoName[] = ["doko", "terraceWork", "football", "sharedMeal"]

const headingClass = "font-display text-3xl leading-tight font-bold text-balance sm:text-4xl"

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = home[locale]
  const dict = getDictionary(locale)
  const href = (path: string) => localizePath(locale, path)
  const bestSeasons = tourism[locale].seasons.filter((season) => season.best)
  const [{ items: posts }, { items: events }] = await Promise.all([listPosts(locale, "news"), listEvents(locale, "upcoming")])
  const latestPosts = posts.slice(0, 3)
  const nextEvents = events.slice(0, 2)

  return (
    <>
      <JsonLd
        data={{
          "@type": "WebSite",
          name: dict.site.name,
          url: new URL(href("/"), site.url).toString(),
          inLanguage: locale,
          description: t.meta.description,
          workTranslation: locales
            .filter((l) => l !== locale)
            .map((l) => ({ "@type": "WebSite", url: new URL(localizePath(l, "/"), site.url).toString(), inLanguage: l })),
        }}
      />

      {/* ── What this site is ────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[26rem] flex-col overflow-hidden bg-ink text-white sm:min-h-[30rem] lg:min-h-[62svh]">
        <PhotoImage photo={photos.village} locale={locale} fill priority sizes="100vw" credit="none" className="-z-20" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/30" />

        <Container className="flex flex-1 flex-col justify-end pt-28 pb-12 sm:pb-16">
          <div className="max-w-2xl">
            <p className="font-medium text-white/85">{t.hero.kicker}</p>
            <h1 id="hero-title" className="mt-2 font-display text-5xl leading-[1.2] font-bold sm:text-7xl">
              {t.hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">{t.hero.lead}</p>
          </div>
        </Container>
        <PhotoCredit photo={photos.village} locale={locale} className="absolute right-4 bottom-4 sm:right-6" />
      </section>

      {/* ── Where to find what people come for ───────────────── */}
      <section aria-labelledby="index-title" className="border-b border-border bg-background">
        <Container className="py-10 sm:py-14">
          <h2 id="index-title" className="text-sm font-semibold text-muted-foreground">
            {t.index.title}
          </h2>
          <ul className="mt-4 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {t.index.items.map((item) => (
              <li key={item.href} className="border-b border-border">
                <Link
                  href={item.href.startsWith("#") ? item.href : href(item.href)}
                  className="group flex h-full items-start justify-between gap-4 py-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pr-6"
                >
                  <span>
                    <span className="block text-lg font-semibold group-hover:text-brand">{item.title}</span>
                    <span className="mt-1 block leading-snug text-muted-foreground">{item.body}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── Latest: only once there is something to show ──────── */}
      {(latestPosts.length > 0 || nextEvents.length > 0) && (
        <Section labelledBy="latest-title">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <h2 id="latest-title" className={headingClass}>
              {t.latest.title}
            </h2>
            <ArrowLink href={href("/updates")} className="shrink-0">
              {t.latest.link}
            </ArrowLink>
          </div>
          <div className={cn("mt-10 grid gap-12", nextEvents.length > 0 && latestPosts.length > 0 && "lg:grid-cols-[2fr_1fr]")}>
            {latestPosts.length > 0 && (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
                {latestPosts.slice(0, nextEvents.length > 0 ? 2 : 3).map((post) => (
                  <PostCard key={post.id} post={post} locale={locale} />
                ))}
              </div>
            )}
            {nextEvents.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold">{t.latest.events}</h3>
                <div className="mt-5 flex flex-col gap-4">
                  {nextEvents.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale} categoryLabel={community[locale].events.categories[event.category]} compact />
                  ))}
                </div>
                <ArrowLink href={href("/community/events")} className="mt-6">
                  {t.latest.eventsLink}
                </ArrowLink>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Songs and dances: the village's identity ──────────── */}
      <section id="songs" aria-labelledby="songs-title" className="scroll-mt-16 bg-ink py-20 text-ink-foreground sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 id="songs-title" className={headingClass}>
                {t.songs.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-foreground/80">{t.songs.lead}</p>
            </div>
            <ArrowLink href={`${href("/about/culture")}#songs-and-dances`} tone="ink" className="shrink-0">
              {t.songs.link}
            </ArrowLink>
          </div>
          <div className="mt-10">
            <VideoPlayer videos={videos} locale={locale} text={videoText[locale]} tone="ink" />
          </div>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink-foreground/65">{videoText[locale].note}</p>
        </Container>
      </section>

      {/* ── History, for the next generation ─────────────────── */}
      <Section labelledBy="history-title">
        <div className="grid gap-12 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <div>
            <h2 id="history-title" className={headingClass}>
              {t.history.title}
            </h2>
            <div className="mt-5 flex max-w-xl flex-col gap-4 text-lg leading-relaxed text-foreground/80">
              {t.history.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href={href("/about/history")} className={buttonStyles.primary}>
                {t.history.read}
              </Link>
              <ArrowLink href={href("/about/archive")}>{t.history.archive}</ArrowLink>
            </div>
            <div className="relative mt-12 hidden aspect-[3/2] overflow-hidden rounded-xl lg:block">
              <PhotoImage photo={photos.grandmother} locale={locale} fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </div>

          <div className="rounded-xl bg-mist p-6 sm:p-8 lg:self-start">
            <h3 className="text-xl font-semibold sm:text-2xl">{t.history.askTitle}</h3>
            <ol className="mt-5 flex list-decimal flex-col gap-3 pl-6 text-lg leading-snug marker:text-muted-foreground">
              {t.history.questions.map((question) => (
                <li key={question} className="pl-1">
                  {question}
                </li>
              ))}
            </ol>
            <p className="mt-6 leading-relaxed text-muted-foreground">{t.history.askNote}</p>
            <Link href={`${href("/contact")}?topic=archive`} className={cn(buttonStyles.secondary, "mt-6")}>
              {t.history.send}
            </Link>
          </div>
        </div>
      </Section>

      {/* ── A day in Ghormu ──────────────────────────────────── */}
      <Section tone="mist" labelledBy="day-title">
        <div className="max-w-2xl">
          <h2 id="day-title" className={headingClass}>
            {t.day.title}
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-foreground/80">
            {t.day.lead.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
          {t.day.moments.map((moment, index) => (
            <li key={moment.label}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                  <PhotoImage photo={photos[DAY[index]]} locale={locale} fill sizes="(min-width: 1024px) 25vw, 50vw" />
                </div>
                <figcaption className="mt-3">
                  <span className="font-semibold">{moment.label}</span>
                  <span className="mt-0.5 block leading-snug text-foreground/75">{moment.caption}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
          <ArrowLink href={href("/about")}>{t.day.about}</ArrowLink>
          <ArrowLink href={href("/explore/gallery")}>{t.day.photos}</ArrowLink>
        </div>
      </Section>

      {/* ── Visiting, and helping ────────────────────────────── */}
      <Section labelledBy="visit-title">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 id="visit-title" className="text-2xl font-semibold sm:text-3xl">
              {t.visit.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">{t.visit.body}</p>
            <p className="mt-5 text-muted-foreground">
              {t.visit.bestTime}: <span className="font-semibold text-foreground">{bestSeasons.map((season) => season.name).join(", ")}</span>
            </p>
            <ArrowLink href={href("/explore/travel-guide")} className="mt-6">
              {t.visit.cta}
            </ArrowLink>
          </div>
          <div className="border-t border-border pt-10 md:border-t-0 md:border-l md:pt-0 md:pl-16">
            <h2 className="text-2xl font-semibold sm:text-3xl">{t.support.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">{t.support.body}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href={href("/support")} className={cn(buttonStyles.primary, "bg-earth hover:brightness-110 focus-visible:outline-earth")}>
                {t.support.primary}
              </Link>
              <ArrowLink href={href("/updates/development")}>{t.support.secondary}</ArrowLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
