import { PolicyPage } from "@/components/site/policy-page"
import legal from "@/content/legal"
import { getDictionary } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].terms
  return pageMetadata(locale, "/terms", t.title, t.lead)
}

export default async function TermsPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale]
  const dict = getDictionary(locale)

  return (
    <PolicyPage
      crumbs={crumbs(locale, [[t.terms.title, "/terms"]])}
      breadcrumbLabel={dict.header.breadcrumb}
      eyebrow={t.terms.eyebrow}
      title={t.terms.title}
      lead={t.terms.lead}
      updated={t.updated}
      sections={t.terms.sections}
    />
  )
}
