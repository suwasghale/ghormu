import { Check } from "lucide-react"

import { ContactForm } from "@/components/site/contact-form"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import contact from "@/content/contact"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = contact[locale].feedback
  return pageMetadata(locale, "/contact/feedback", t.title, t.lead, photos.grandmother)
}

export default async function FeedbackPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = contact[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        photo={{ photo: photos.grandmother, locale }}
        crumbs={crumbs(locale, [
          [t.contact.title, "/contact"],
          [t.feedback.title, "/contact/feedback"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.feedback.title}
        lead={t.feedback.lead}
      />

      <Section className="pt-12 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <aside className="reveal">
            <h2 className="font-display text-xl font-semibold">{t.feedback.helpsTitle}</h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              {t.feedback.helps.map((item) => (
                <li key={item} className="flex items-start gap-3 leading-relaxed">
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
          <div className="reveal rounded-3xl border border-border p-6 sm:p-10">
            <ContactForm locale={locale} strings={t.form} defaultTopic="feedback" privacyHref={localizePath(locale, "/privacy")} />
          </div>
        </div>
      </Section>
    </>
  )
}
