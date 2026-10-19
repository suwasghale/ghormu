import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ChevronDown, CloudSun, Heart } from "lucide-react"

import { EventCard } from "@/components/site/event-card"
import { JsonLd } from "@/components/site/json-ld"
import { PhotoCredit, PhotoImage } from "@/components/site/photo"
import { PostCard } from "@/components/site/post-card"
import { ArrowLink, buttonStyles, Container, Section } from "@/components/site/section"
import { site } from "@/config/site"
import community from "@/content/community"
import home from "@/content/home"
import { photos, type PhotoName } from "@/content/photos"
import tourism from "@/content/tourism"
import { listEvents, listPosts } from "@/lib/api/content"
import { getDictionary, isLocale, localizePath, locales } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"
import { cn } from "@/lib/utils"

/** Static, but refreshed when news or events are published (see lib/api/content). */
export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return {
    description: home[locale].meta.description,
    alternates: alternatesFor(locale, "/"),
    openGraph: { images: [{ url: photos.village.src, width: photos.village.width, height: photos.village.height, alt: photos.village.alt[locale] }] },
  }
}

/** "A day in Ghormu", in order. Staggered on wide screens like a contact sheet. */
const DAY: PhotoName[] = ["doko", "terraceWork", "football", "sharedMeal"]

const headingClass = "font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl"

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

      {/* ── Arrival ──────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-white">
        <div className="hero-zoom absolute inset-0 -z-20">
          <PhotoImage photo={photos.village} locale={locale} fill priority sizes="100vw" credit="none" />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/75 via-transparent to-ink/50" />

        <Container className="flex flex-1 flex-col justify-end pt-32 pb-24 sm:pb-28">
          <div className="rise max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-white/80 sm:text-base">{t.hero.kicker}</p>
            <h1 id="hero-title" className="mt-3 font-display text-7xl leading-[1.1] font-bold tracking-tight sm:text-8xl lg:text-[8.5rem]">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{t.hero.lead}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href={href("/about")} className={cn(buttonStyles.primary, "bg-white text-ink hover:bg-white/90 focus-visible:outline-white")}>
                {t.hero.primary}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href={href("/support")}
                className="group inline-flex items-center gap-2 font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Heart aria-hidden="true" className="size-4 text-earth" />
                {t.hero.secondary}
              </Link>
            </div>
          </div>
        </Container>

        <a
          href="#letter"
          aria-label={t.hero.scroll}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-2 text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-white sm:block"
        >
          <ChevronDown aria-hidden="true" className="size-6 animate-bounce" />
        </a>
        <PhotoCredit photo={photos.village} locale={locale} className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6" />
      </section>

      {/* ── A note from the village ──────────────────────────── */}
      <Section id="letter" labelledBy="letter-title" className="py-24 sm:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-20">
          <div className="reveal relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[2rem] lg:mx-0">
            <PhotoImage photo={photos.fodder} locale={locale} fill sizes="(min-width: 1024px) 40vw, 90vw" />
          </div>
          <div className="reveal max-w-xl">
            <h2 id="letter-title" className={headingClass}>
              {t.letter.title}
            </h2>
            <div className="mt-8 flex flex-col gap-5 text-lg leading-[1.8] text-foreground/80">
              {t.letter.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-8 font-display text-xl text-foreground">— {t.letter.signature}</p>
            <ArrowLink href={href("/about")} className="mt-8">
              {t.letter.link}
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* ── A day in Ghormu ──────────────────────────────────── */}
      <section aria-labelledby="day-title" className="bg-snow py-24 sm:py-32">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="reveal max-w-xl">
              <h2 id="day-title" className={headingClass}>
                {t.day.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.day.lead}</p>
            </div>
            <ArrowLink href={href("/explore/gallery")} className="reveal shrink-0">
              {t.day.link}
            </ArrowLink>
          </div>

          <ol className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {t.day.moments.map((moment, index) => (
              <li key={moment.label} className={cn("reveal", index % 2 === 1 && "lg:mt-16")}>
                <figure>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                    <PhotoImage photo={photos[DAY[index]]} locale={locale} fill sizes="(min-width: 1024px) 25vw, 50vw" />
                  </div>
                  <figcaption className="mt-4">
                    <span className="text-sm font-semibold text-earth">{moment.label}</span>
                    <span className="mt-1 block leading-relaxed text-foreground/80">{moment.caption}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Traditions ───────────────────────────────────────── */}
      <Section labelledBy="traditions-title" className="py-24 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-[5fr_6fr] lg:gap-20">
          <div className="reveal relative order-last aspect-[4/5] overflow-hidden rounded-[2rem] lg:order-first lg:sticky lg:top-24 lg:self-start">
            <PhotoImage photo={photos.chorten} locale={locale} fill sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
          <div>
            <div className="reveal max-w-xl">
              <h2 id="traditions-title" className={headingClass}>
                {t.traditions.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.traditions.lead}</p>
            </div>
            <dl className="mt-12 border-t border-border">
              {t.traditions.items.map((item) => (
                <div key={item.name} className="reveal grid gap-2 border-b border-border py-7 sm:grid-cols-[11rem_1fr] sm:gap-8">
                  <dt className="font-display text-2xl font-semibold">{item.name}</dt>
                  <dd className="leading-relaxed text-muted-foreground sm:pt-1.5">{item.body}</dd>
                </div>
              ))}
            </dl>
            <ArrowLink href={href("/about/culture")} className="reveal mt-10">
              {t.traditions.link}
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* ── Visit ────────────────────────────────────────────── */}
      <section aria-labelledby="visit-title" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PhotoImage photo={photos.trail} locale={locale} fill sizes="100vw" credit="none" className="-z-20" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/10" />
        <Container className="py-28 sm:py-40">
          <div className="reveal max-w-lg">
            <h2 id="visit-title" className={headingClass}>
              {t.visit.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-foreground/80">{t.visit.body}</p>

            <dl className="mt-10 grid gap-6 border-t border-ink-foreground/15 pt-8 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink-foreground/60">{t.visit.bestTime}</dt>
                <dd className="mt-1 font-display text-xl font-semibold">{bestSeasons.map((season) => season.name).join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-foreground/60">{t.visit.weather}</dt>
                <dd className="mt-1">
                  <Link href={href("/explore/travel-guide")} className="inline-flex items-center gap-2 font-display text-xl font-semibold text-earth hover:underline">
                    <CloudSun aria-hidden="true" className="size-5" />
                    {dict.nav.travelGuide}
                  </Link>
                </dd>
              </div>
            </dl>

            <Link href={href("/explore")} className={cn(buttonStyles.onInk, "mt-10")}>
              {t.visit.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </Container>
        <PhotoCredit photo={photos.trail} locale={locale} className="absolute right-4 bottom-4" />
      </section>

      {/* ── Support ──────────────────────────────────────────── */}
      <Section labelledBy="support-title" className="py-24 sm:py-36">
        <div className="grid items-center gap-12 overflow-hidden rounded-[2rem] bg-brand-muted lg:grid-cols-2 lg:gap-0">
          <div className="reveal p-8 sm:p-14">
            <h2 id="support-title" className={headingClass}>
              {t.support.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/75">{t.support.body}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href={href("/support")} className={cn(buttonStyles.primary, "bg-earth hover:brightness-110 focus-visible:outline-earth")}>
                <Heart aria-hidden="true" className="size-4" />
                {t.support.primary}
              </Link>
              <ArrowLink href={href("/updates/development")}>{t.support.secondary}</ArrowLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[28rem]">
            <PhotoImage photo={photos.smiles} locale={locale} fill sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </Section>

      {/* ── Latest: only once there is something to show ──────── */}
      {(latestPosts.length > 0 || nextEvents.length > 0) && (
        <Section tone="mist" labelledBy="latest-title">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <h2 id="latest-title" className={cn(headingClass, "reveal")}>
              {t.latest.title}
            </h2>
            <ArrowLink href={href("/updates")} className="reveal shrink-0">
              {t.latest.link}
            </ArrowLink>
          </div>
          <div className={cn("mt-12 grid gap-12", nextEvents.length > 0 && latestPosts.length > 0 && "lg:grid-cols-[2fr_1fr]")}>
            {latestPosts.length > 0 && (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
                {latestPosts.slice(0, nextEvents.length > 0 ? 2 : 3).map((post) => (
                  <PostCard key={post.id} post={post} locale={locale} />
                ))}
              </div>
            )}
            {nextEvents.length > 0 && (
              <div className="reveal">
                <h3 className="font-display text-xl font-semibold">{t.latest.events}</h3>
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
    </>
  )
}
