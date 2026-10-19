import Link from "next/link"

import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section } from "@/components/site/section"
import community from "@/content/community"
import { getDictionary, localizePath } from "@/lib/i18n"
import { formatIndex } from "@/lib/i18n/config"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"
import { photos } from "@/content/photos"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale].surnames
  return pageMetadata(locale, "/community/surnames", t.title, t.lead)
}

export default async function SurnamesPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = community[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        photo={{ photo: photos.greens, locale }}
        crumbs={crumbs(locale, [
          [t.overview.title, "/community"],
          [t.surnames.title, "/community/surnames"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.surnames.title}
        lead={t.surnames.lead}
      />

      <Section>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.surnames.clans.map((clan, index) => (
            <li
              key={clan.name}
              className={cn(
                "reveal relative isolate flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl p-8",
                clan.first ? "bg-ink text-ink-foreground" : "bg-brand-muted",
              )}
            >
              <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
              <div>
                <p className="font-display text-4xl font-semibold">{clan.name}</p>
                <p lang={locale === "ne" ? "en" : "ne"} className={cn("mt-1", clan.first ? "text-ink-foreground/60" : "text-muted-foreground")}>
                  {clan.latin}
                </p>
                <p className={cn("mt-5 flex items-center gap-2 text-sm font-medium", clan.first ? "text-ink-foreground/85" : "text-muted-foreground")}>
                  <span aria-hidden="true" className={cn("size-2 rounded-full", clan.first ? "bg-earth ring-4 ring-earth/20" : "bg-muted-foreground/40")} />
                  {clan.first ? t.surnames.statusFirst : t.surnames.statusNext}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="reveal mt-16 rounded-3xl border border-border p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t.surnames.helpTitle}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t.surnames.helpBody}</p>
          </div>
          <Link href={localizePath(locale, "/contact")} className={cn(buttonStyles.primary, "mt-6 shrink-0 lg:mt-0")}>
            {t.surnames.helpCta}
          </Link>
        </div>
      </Section>
    </>
  )
}
