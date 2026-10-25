import { PolicyPage } from "@/components/site/policy-page"
import legal from "@/content/legal"
import { getDictionary } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].privacy
  return pageMetadata(locale, "/privacy", t.title, t.lead)
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale]
  const dict = getDictionary(locale)

  return (
    <PolicyPage
      crumbs={crumbs(locale, [[t.privacy.title, "/privacy"]])}
      breadcrumbLabel={dict.header.breadcrumb}
      title={t.privacy.title}
      lead={t.privacy.lead}
      updated={t.updated}
      sections={t.privacy.sections}
    />
  )
}
