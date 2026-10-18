import Link from "next/link"

import { Faq } from "@/components/site/faq"
import { JsonLd } from "@/components/site/json-ld"
import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section } from "@/components/site/section"
import contact from "@/content/contact"
import legal from "@/content/legal"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].faq
  return pageMetadata(locale, "/faq", t.title, t.lead)
}

export default async function FaqPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].faq
  const dict = getDictionary(locale)

  return (
    <>
      <JsonLd
        data={{
          "@type": "FAQPage",
          inLanguage: locale,
          mainEntity: t.groups.flatMap((group) =>
            group.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          ),
        }}
      />

      <PageHero
        crumbs={crumbs(locale, [[t.title, "/faq"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          {t.groups.map((group) => (
            <section key={group.title} className="reveal">
              <h2 className="font-display text-2xl font-semibold">{group.title}</h2>
              <div className="mt-6">
                <Faq items={group.items} />
              </div>
            </section>
          ))}

          <div className="reveal rounded-3xl bg-brand-muted p-8 text-center">
            <p className="font-display text-xl font-semibold">{contact[locale].contact.lead}</p>
            <Link href={localizePath(locale, "/contact")} className={`${buttonStyles.primary} mt-6`}>
              {dict.nav.contactUs}
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
