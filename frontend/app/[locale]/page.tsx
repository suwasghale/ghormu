import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Archive,
  ArrowRight,
  BookOpen,
  Compass,
  Flower2,
  Footprints,
  HandHeart,
  HeartHandshake,
  Landmark,
  MapPinned,
  Scissors,
  Sun,
  Trees,
  Users,
} from "lucide-react"

import { JsonLd } from "@/components/site/json-ld"
import { Landscape } from "@/components/site/landscape"
import { ArrowLink, buttonStyles, Container, Section, SectionHeader } from "@/components/site/section"
import { TopoPattern } from "@/components/site/topo-pattern"
import { site } from "@/config/site"
import home from "@/content/home"
import { getDictionary, isLocale, localizePath, locales } from "@/lib/i18n"
import { alternatesFor } from "@/lib/i18n/metadata"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return { description: home[locale].meta.description, alternates: alternatesFor(locale, "/") }
}

const PILLARS = [
  { icon: BookOpen, href: "/about" },
  { icon: Compass, href: "/explore" },
  { icon: Users, href: "/community" },
  { icon: Archive, href: "/about/archive" },
]

const CULTURE_ICONS = [Sun, Scissors, Flower2, HeartHandshake]

const EXPLORE_ICONS = [Trees, Footprints, Landmark, HandHeart]

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = home[locale]
  const dict = getDictionary(locale)
  const href = (path: string) => localizePath(locale, path)

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

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[min(calc(100svh-4rem),52rem)] flex-col overflow-hidden">
        <Landscape className="absolute inset-0 -z-10" />
        {/* Soft wash behind the text so it stays readable over the peaks. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_15%_25%,var(--snow)_0%,color-mix(in_oklch,var(--snow)_60%,transparent)_45%,transparent_75%)]"
        />
        <Container className="pt-16 pb-48 sm:pt-24 sm:pb-64">
          <div className="rise max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-brand">{t.hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-5 font-display text-6xl leading-[1.15] font-bold tracking-tight sm:text-8xl">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75 sm:text-xl">{t.hero.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={href("/about")} className={buttonStyles.primary}>
                {t.hero.primary}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href={href("/explore")} className={buttonStyles.secondary}>
                {t.hero.secondary}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Introduction and what the site offers */}
      <Section labelledBy="intro-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <SectionHeader id="intro-title" eyebrow={t.intro.eyebrow} title={t.intro.title} />
          <div className="reveal">
            <p className="text-lg leading-relaxed text-muted-foreground lg:mt-9">{t.intro.body}</p>
            <ArrowLink href={href("/about")} className="mt-6">
              {t.intro.link}
            </ArrowLink>
          </div>
        </div>

        <h3 className="sr-only">{t.pillars.title}</h3>
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.pillars.items.map((item, index) => {
            const { icon: Icon, href: path } = PILLARS[index]
            return (
              <li key={item.title} className="reveal">
                <Link
                  href={href(path)}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="mt-5 flex items-center justify-between font-display text-xl font-semibold">
                    {item.title}
                    <ArrowRight aria-hidden="true" className="size-4 text-brand opacity-0 transition group-hover:opacity-100" />
                  </span>
                  <span className="mt-2 leading-relaxed text-muted-foreground">{item.body}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Culture */}
      <Section tone="mist" labelledBy="culture-title" className="overflow-hidden">
        <TopoPattern className="absolute inset-0 h-full w-full text-brand/[0.07]" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeader id="culture-title" eyebrow={t.culture.eyebrow} title={t.culture.title} lead={t.culture.lead} />
          <ArrowLink href={href("/about/culture")} className="reveal shrink-0">
            {t.culture.link}
          </ArrowLink>
        </div>
        <ul className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.culture.items.map((item, index) => {
            const Icon = CULTURE_ICONS[index]
            return (
              <li key={item.title} className="reveal rounded-2xl bg-background/80 p-6 ring-1 ring-border backdrop-blur-sm">
                <Icon aria-hidden="true" className="size-6 text-earth" />
                <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Explore */}
      <section aria-labelledby="explore-title" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-ink-foreground/[0.06]" />
        <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader id="explore-title" tone="ink" eyebrow={t.explore.eyebrow} title={t.explore.title} lead={t.explore.lead} />
            <Link href={href("/explore")} className={`${buttonStyles.onInk} reveal mt-9`}>
              {t.explore.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4">
            {t.explore.highlights.map((label, index) => {
              const Icon = EXPLORE_ICONS[index]
              return (
                <li
                  key={label}
                  className="reveal flex aspect-[4/3] flex-col justify-between rounded-2xl border border-ink-foreground/10 bg-ink-foreground/[0.04] p-5"
                >
                  <Icon aria-hidden="true" className="size-7 text-earth" />
                  <span className="font-display text-xl font-semibold sm:text-2xl">{label}</span>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {/* 3D map teaser */}
      <Section labelledBy="map-title">
        <div className="reveal relative isolate overflow-hidden rounded-3xl bg-brand-muted px-6 py-14 sm:px-12 sm:py-20">
          <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-brand/20" />
          <MapPinned aria-hidden="true" className="absolute top-[38%] right-[18%] -z-10 hidden size-10 text-earth sm:block" />
          <MapPinned aria-hidden="true" className="absolute right-[34%] bottom-[22%] -z-10 hidden size-7 text-brand sm:block" />
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-background px-3 py-1 text-sm font-semibold text-brand ring-1 ring-brand/20">
              {t.map.eyebrow} · {t.map.badge}
            </span>
            <h2 id="map-title" className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {t.map.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.map.body}</p>
          </div>
        </div>
      </Section>

      {/* Community */}
      <Section tone="brand" labelledBy="community-title">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionHeader id="community-title" eyebrow={t.community.eyebrow} title={t.community.title} lead={t.community.lead} />
            <div className="reveal mt-9 flex flex-wrap gap-3">
              <Link href={href("/community")} className={buttonStyles.primary}>
                {t.community.primary}
              </Link>
              <Link href="/login" className={buttonStyles.secondary}>
                {t.community.secondary}
              </Link>
            </div>
          </div>
          <ul className="reveal flex flex-wrap gap-3 lg:justify-end">
            {t.community.surnames.map((name) => (
              <li
                key={name}
                className="rounded-full bg-background px-6 py-3 font-display text-xl font-semibold text-brand shadow-sm ring-1 ring-brand/15"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Help preserve the archive */}
      <Section labelledBy="archive-title">
        <div className="reveal mx-auto max-w-3xl text-center">
          <Archive aria-hidden="true" className="mx-auto size-8 text-earth" />
          <h2 id="archive-title" className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {t.archive.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.archive.body}</p>
          <Link href={href("/contact")} className={`${buttonStyles.primary} mt-9`}>
            {t.archive.cta}
          </Link>
        </div>
      </Section>
    </>
  )
}
