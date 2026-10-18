import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  Flower2,
  Footprints,
  HandHeart,
  HeartHandshake,
  Landmark,
  Scissors,
  Sun,
  Trees,
} from "lucide-react"

import { EventCard } from "@/components/site/event-card"
import { JsonLd } from "@/components/site/json-ld"
import { Landscape } from "@/components/site/landscape"
import { PhotoStack } from "@/components/site/photo-stack"
import { ArrowLink, buttonStyles, Container, Eyebrow, Section, SectionHeader } from "@/components/site/section"
import { PostCard } from "@/components/site/post-card"
import { Terrain3D } from "@/components/site/terrain-3d"
import { ThroughTimeSection } from "@/components/site/through-time-section"
import { TopoPattern } from "@/components/site/topo-pattern"
import { site } from "@/config/site"
import community from "@/content/community"
import home from "@/content/home"
import tourism from "@/content/tourism"
import { formatIndex, getDictionary, isLocale, localizePath, locales } from "@/lib/i18n"
import { listEvents, listPosts } from "@/lib/api/content"
import { alternatesFor } from "@/lib/i18n/metadata"
import { cn } from "@/lib/utils"

/** Static, but refreshed when news or events are published (see lib/api/content). */
export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return { description: home[locale].meta.description, alternates: alternatesFor(locale, "/") }
}

/** In-page anchors, in the order of the hero's section index. */
const ANCHORS = ["intro", "culture", "explore", "community"]

const PILLAR_LINKS = ["/about", "/explore", "/community", "/about/archive"]

const CULTURE_ICONS = [Sun, Scissors, Flower2, HeartHandshake]

const EXPLORE_ICONS = [Trees, Footprints, Landmark, HandHeart]

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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
        <Landscape className="absolute inset-0 -z-10" />
        {/* Soft wash behind the text so it stays readable over the peaks. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_56%_at_6%_30%,var(--snow)_0%,color-mix(in_oklch,var(--snow)_80%,transparent)_38%,color-mix(in_oklch,var(--snow)_35%,transparent)_58%,transparent_78%)]"
        />

        <Container className="flex flex-1 flex-col pt-14 pb-[38vh] sm:pt-20 lg:pb-[32vh]">
          <div className="rise max-w-3xl">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1
              id="hero-title"
              className="mt-6 font-display text-7xl leading-[1.12] font-bold tracking-tight text-ink sm:text-8xl lg:text-[9rem]"
            >
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75 sm:text-xl">{t.hero.lead}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={href("/about")} className={buttonStyles.primary}>
                {t.hero.primary}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href={href("/explore")} className={cn(buttonStyles.secondary, "bg-background/70 backdrop-blur")}>
                {t.hero.secondary}
              </Link>
            </div>
          </div>
        </Container>

        {/* Index of this page, set along the foreground ridge */}
        <nav aria-label={t.hero.indexLabel} className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/25 to-transparent sm:block">
          <Container>
            <ol className="grid grid-cols-4 border-t border-white/20">
              {t.hero.index.map((label, index) => (
                <li key={label}>
                  <a
                    href={`#${ANCHORS[index]}`}
                    className="group flex items-baseline gap-3 py-5 text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
                    <span className="font-medium">{label}</span>
                    <ArrowRight aria-hidden="true" className="size-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ol>
          </Container>
        </nav>
      </section>

      {/* ── Introduction ─────────────────────────────────────── */}
      <Section id="intro" labelledBy="intro-title" className="py-24 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="reveal lg:col-span-4">
            <Eyebrow>{t.intro.eyebrow}</Eyebrow>
            <h2 id="intro-title" className="mt-4 font-display text-2xl leading-snug font-semibold text-balance sm:text-3xl">
              {t.intro.title}
            </h2>
          </div>
          <div className="reveal lg:col-span-8">
            <p className="font-display text-2xl leading-[1.65] text-foreground/90 sm:text-[1.85rem]">{t.intro.body}</p>
            <ArrowLink href={href("/about")} className="mt-8">
              {t.intro.link}
            </ArrowLink>
          </div>
        </div>

        <h3 className="sr-only">{t.pillars.title}</h3>
        <ol className="mt-20 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {t.pillars.items.map((item, index) => (
            <li
              key={item.title}
              className="reveal border-b border-border sm:odd:pr-8 sm:even:border-l sm:even:pl-8 lg:border-b-0 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
            >
              <Link
                href={href(PILLAR_LINKS[index])}
                className="group relative block h-full py-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <span aria-hidden="true" className="absolute -top-px left-0 h-0.5 w-0 bg-brand transition-all duration-500 group-hover:w-full" />
                <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
                <span className="mt-6 flex items-center justify-between gap-3 font-display text-2xl font-semibold">
                  {item.title}
                  <ArrowUpRight aria-hidden="true" className="size-5 text-brand transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="mt-3 block leading-relaxed text-muted-foreground">{item.body}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Culture ──────────────────────────────────────────── */}
      <Section id="culture" tone="mist" labelledBy="culture-title" className="overflow-hidden py-24 sm:py-32">
        <TopoPattern className="absolute inset-0 h-full w-full text-brand/[0.06]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader id="culture-title" eyebrow={t.culture.eyebrow} title={t.culture.title} lead={t.culture.lead} />
          <ArrowLink href={href("/about/culture")} className="reveal shrink-0">
            {t.culture.link}
          </ArrowLink>
        </div>

        <ul className="relative mt-14 grid gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {t.culture.items.map((item, index) => {
            const Icon = CULTURE_ICONS[index]

            if (index === 0) {
              return (
                <li
                  key={item.title}
                  className="reveal relative isolate flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-3xl bg-ink p-8 text-ink-foreground sm:p-10 lg:col-span-2 lg:row-span-2 lg:min-h-[30rem]"
                >
                  <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-ink-foreground/[0.08]" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-4 -right-6 -z-10 font-display text-[8rem] leading-none font-bold whitespace-nowrap text-ink-foreground/[0.06] sm:text-[11rem]"
                  >
                    {item.title}
                  </span>
                  <Icon aria-hidden="true" className="size-8 text-earth" />
                  <h3 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">{item.title}</h3>
                  <p className="mt-3 max-w-md text-lg leading-relaxed text-ink-foreground/75">{item.body}</p>
                </li>
              )
            }

            return (
              <li
                key={item.title}
                className={cn(
                  "reveal flex flex-col rounded-3xl bg-background/90 p-7 ring-1 ring-border backdrop-blur-sm",
                  index === 1 && "lg:col-span-2",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-earth/10 text-earth">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="font-display text-sm text-muted-foreground">{formatIndex(locale, index + 1)}</span>
                </div>
                <h3 className="mt-auto pt-8 font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* ── Explore ──────────────────────────────────────────── */}
      <section id="explore" aria-labelledby="explore-title" className="relative isolate scroll-mt-20 overflow-hidden bg-ink text-ink-foreground">
        <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-ink-foreground/[0.05]" />
        <Container className="grid gap-16 py-24 sm:py-32 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <SectionHeader id="explore-title" tone="ink" eyebrow={t.explore.eyebrow} title={t.explore.title} lead={t.explore.lead} />
            <ul className="reveal mt-10 grid grid-cols-2 gap-x-8 border-t border-ink-foreground/15">
              {t.explore.highlights.map((label, index) => {
                const Icon = EXPLORE_ICONS[index]
                return (
                  <li key={label} className="flex items-center gap-3 border-b border-ink-foreground/15 py-4">
                    <Icon aria-hidden="true" className="size-5 shrink-0 text-earth" />
                    <span className="text-lg font-medium">{label}</span>
                  </li>
                )
              })}
            </ul>
            <Link href={href("/explore")} className={cn(buttonStyles.onInk, "reveal mt-10")}>
              {t.explore.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="reveal relative pb-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] ring-1 ring-ink-foreground/10 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Landscape id="explore-ls" still className="absolute inset-0" />
            </div>
            <div className="absolute bottom-0 left-5 rounded-2xl bg-ink/85 p-5 ring-1 ring-ink-foreground/15 backdrop-blur-md sm:left-8">
              <p className="text-sm font-semibold text-earth">{tourism[locale].recommended}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {bestSeasons.map((season) => (
                  <li key={season.name} className="flex items-baseline gap-3">
                    <span className="font-display text-xl font-semibold">{season.name}</span>
                    <span className="text-sm text-ink-foreground/65">{season.months.split(" · ")[0]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3D map teaser ───────────────────────────────────── */}
      <Section labelledBy="map-title" className="py-24 sm:py-32">
        <div className="reveal grid overflow-hidden rounded-[2rem] bg-brand text-brand-foreground lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-14">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-foreground/10 px-3 py-1 text-sm font-semibold ring-1 ring-brand-foreground/20">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-earth" />
              {t.map.eyebrow} · {t.map.badge}
            </span>
            <h2 id="map-title" className="mt-6 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              {t.map.title}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-brand-foreground/80">{t.map.body}</p>
          </div>
          <Terrain3D labels={t.map.places} className="min-h-96" />
        </div>
      </Section>

      <ThroughTimeSection locale={locale} />

      {/* ── Latest: only once there is something to show ──────── */}
      {(latestPosts.length > 0 || nextEvents.length > 0) && (
        <Section labelledBy="latest-title" className="py-24 sm:py-32">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader id="latest-title" eyebrow={t.latest.eyebrow} title={t.latest.title} />
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

      {/* ── Community ────────────────────────────────────────── */}
      <Section id="community" tone="brand" labelledBy="community-title" className="py-24 sm:py-32">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="community-title" eyebrow={t.community.eyebrow} title={t.community.title} lead={t.community.lead} />
          <div className="reveal flex shrink-0 flex-wrap gap-3">
            <Link href={href("/community")} className={buttonStyles.primary}>
              {t.community.primary}
            </Link>
            <Link href="/login" className={buttonStyles.secondary}>
              {t.community.secondary}
            </Link>
          </div>
        </div>

        <ul className="mt-16 grid grid-cols-2 border-t border-brand/15 sm:grid-cols-3 lg:grid-cols-5">
          {t.community.surnames.map((name, index) => {
            const first = index === 0
            return (
              <li
                key={name}
                className="reveal border-b border-brand/15 py-8 pr-4 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
              >
                <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
                <p className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{name}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className={cn("size-2 rounded-full", first ? "bg-brand ring-4 ring-brand/15" : "bg-muted-foreground/35")} />
                  <span className="sr-only">{t.community.portal}: </span>
                  {first ? t.community.statusFirst : t.community.statusNext}
                </p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* ── Archive ──────────────────────────────────────────── */}
      <Section labelledBy="archive-title" className="py-24 sm:py-32">
        <div className="reveal grid items-center gap-12 overflow-hidden rounded-[2rem] bg-[color-mix(in_oklch,var(--earth)_10%,var(--snow))] p-8 sm:p-14 lg:grid-cols-2 lg:gap-16">
          <PhotoStack className="order-last lg:order-first" />
          <div>
            <Eyebrow className="text-earth">{t.archive.eyebrow}</Eyebrow>
            <h2 id="archive-title" className="mt-4 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              {t.archive.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.archive.body}</p>
            <Link href={href("/contact")} className={cn(buttonStyles.primary, "mt-9")}>
              {t.archive.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
