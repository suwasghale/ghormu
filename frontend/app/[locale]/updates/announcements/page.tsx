import { BellRing } from "lucide-react"

import { EmptyState, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { NoticeRow } from "@/components/site/post-card"
import { Section } from "@/components/site/section"
import { SubNav } from "@/components/site/sub-nav"
import updates from "@/content/updates"
import { listPosts } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { updatesTabs } from "@/lib/i18n/sections"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = updates[locale].announcements
  return pageMetadata(locale, "/updates/announcements", t.title, t.lead)
}

export default async function AnnouncementsPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = updates[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listPosts(locale, "announcement")

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [t.news.title, "/updates"],
          [t.announcements.title, "/updates/announcements"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        title={t.announcements.title}
        lead={t.announcements.lead}
      />

      <Section className="pt-12 sm:pt-16">
        <SubNav label={dict.nav.updates} links={updatesTabs(locale)} current={localizePath(locale, "/updates/announcements")} />

        {!ok && <LoadFailed message={t.loadFailed} />}

        {ok && items.length === 0 && (
          <EmptyState icon={BellRing} title={t.announcements.emptyTitle} body={t.announcements.emptyBody} />
        )}

        {items.length > 0 && (
          <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
            {items.map((post) => (
              <NoticeRow
                key={post.id}
                post={post}
                locale={locale}
                pinnedLabel={t.announcements.pinned}
                attachmentLabel={t.announcements.attachment}
              />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
