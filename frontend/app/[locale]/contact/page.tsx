import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

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
  const t = contact[locale].contact
  return pageMetadata(locale, "/contact", t.title, t.lead)
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = contact[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        photo={{ photo: photos.welcome, locale }}
        crumbs={crumbs(locale, [[t.contact.title, "/contact"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.contact.title}
        lead={t.contact.lead}
      />

      <Section className="pt-12 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="reveal rounded-3xl border border-border p-6 sm:p-10">
            <h2 className="font-display text-2xl font-semibold">{t.contact.formTitle}</h2>
            <p className="mt-2 mb-8 text-muted-foreground">{t.contact.reply}</p>
            <ContactForm locale={locale} strings={t.form} privacyHref={localizePath(locale, "/privacy")} />
          </div>

          <aside className="reveal">
            <h2 className="font-display text-xl font-semibold">{t.contact.otherTitle}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {t.contact.other.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localizePath(locale, item.href)}
                    className="group flex items-start justify-between gap-4 rounded-2xl bg-muted p-5 transition-colors hover:bg-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span>
                      <span className="block font-semibold group-hover:text-brand">{item.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.body}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>
    </>
  )
}
