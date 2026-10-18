import Link from "next/link"
import { Footprints, HeartHandshake, PartyPopper, Sprout, UtensilsCrossed } from "lucide-react"

import { PageHero } from "@/components/site/page-hero"
import { ArrowLink, buttonStyles, Section, SectionHeader } from "@/components/site/section"
import explore from "@/content/explore-more"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = explore[locale].experiences
  return pageMetadata(locale, "/explore/experiences", t.title, t.lead)
}

const ICONS = [UtensilsCrossed, PartyPopper, Footprints, Sprout]

export default async function ExperiencesPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = explore[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
          [t.experiences.title, "/explore/experiences"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.experiences.title}
        lead={t.experiences.lead}
      />

      <Section labelledBy="ideas-title">
        <SectionHeader id="ideas-title" title={t.experiences.ideasTitle} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {t.experiences.ideas.map((idea, index) => {
            const Icon = ICONS[index]
            return (
              <li key={idea.title} className="reveal flex gap-5 rounded-3xl border border-border p-6 sm:p-8">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{idea.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{idea.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section tone="mist" labelledBy="hosts-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="reveal">
            <h2 id="hosts-title" className="font-display text-2xl font-semibold sm:text-3xl">
              {t.experiences.hostsTitle}
            </h2>
            {t.experiences.hosts.length > 0 ? (
              <ul className="mt-6 divide-y divide-border rounded-2xl bg-background px-6 ring-1 ring-border">
                {t.experiences.hosts.map((host) => (
                  <li key={host.name} className="py-4">
                    <p className="font-semibold">{host.name}</p>
                    <p className="text-sm text-muted-foreground">{host.offer}</p>
                    <p className="mt-1 text-sm font-medium text-brand">{host.contact}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.experiences.hostsPending}</p>
                <Link href={`${localizePath(locale, "/contact")}?topic=travel`} className={`${buttonStyles.primary} mt-8`}>
                  {t.experiences.cta}
                </Link>
              </>
            )}
          </div>
          <div className="reveal rounded-3xl bg-background p-8 ring-1 ring-border">
            <HeartHandshake aria-hidden="true" className="size-7 text-earth" />
            <h2 className="mt-4 font-display text-2xl font-semibold">{t.experiences.respectTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t.experiences.respectBody}</p>
            <ArrowLink href={localizePath(locale, "/explore")} className="mt-6">
              {t.experiences.respectLink}
            </ArrowLink>
          </div>
        </div>
      </Section>
    </>
  )
}
