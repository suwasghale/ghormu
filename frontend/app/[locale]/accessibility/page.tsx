import Link from "next/link"
import { Check, Info } from "lucide-react"

import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Container } from "@/components/site/section"
import legal from "@/content/legal"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].accessibility
  return pageMetadata(locale, "/accessibility", t.title, t.lead)
}

export default async function AccessibilityPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [[t.accessibility.title, "/accessibility"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.accessibility.eyebrow}
        title={t.accessibility.title}
        lead={t.accessibility.lead}
      />

      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground">{t.updated}</p>
          <p className="mt-8 rounded-2xl bg-brand-muted p-6 font-display text-xl font-semibold">{t.accessibility.goal}</p>

          <h2 className="mt-14 font-display text-2xl font-semibold">{t.accessibility.doneTitle}</h2>
          <ul className="mt-6 flex flex-col gap-3.5">
            {t.accessibility.done.map((item) => (
              <li key={item} className="flex items-start gap-3 text-lg leading-relaxed">
                <Check aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-display text-2xl font-semibold">{t.accessibility.limitsTitle}</h2>
          <ul className="mt-6 flex flex-col gap-3.5">
            {t.accessibility.limits.map((item) => (
              <li key={item} className="flex items-start gap-3 text-lg leading-relaxed text-muted-foreground">
                <Info aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-earth" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-3xl border border-border p-8">
            <h2 className="font-display text-2xl font-semibold">{t.accessibility.feedbackTitle}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t.accessibility.feedbackBody}</p>
            <Link href={localizePath(locale, "/contact/feedback")} className={`${buttonStyles.primary} mt-6`}>
              {t.accessibility.feedbackCta}
            </Link>
          </div>
        </div>
      </Container>
    </>
  )
}
