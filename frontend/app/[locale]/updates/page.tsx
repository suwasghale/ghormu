import { Newspaper } from "lucide-react"

import { EmptyState, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { PostCard } from "@/components/site/post-card"
import { Section } from "@/components/site/section"
import { SubNav } from "@/components/site/sub-nav"
import updates from "@/content/updates"
import { listPosts } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { updatesTabs } from "@/lib/i18n/sections"
import { photos } from "@/content/photos"

/** Refreshed on publish by the admin; this is only the safety net. */
export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/updates", updates[locale].news.title, updates[locale].news.lead, photos.play)
}

export default async function NewsPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = updates[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listPosts(locale, "news")
  const [featured, ...rest] = items

  return (
    <>
      <PageHero
        photo={{ photo: photos.play, locale }}
        crumbs={crumbs(locale, [[t.news.title, "/updates"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        title={t.news.title}
        lead={t.news.lead}
      />

      <Section className="pt-12 sm:pt-16">
        <SubNav label={dict.nav.updates} links={updatesTabs(locale)} current={localizePath(locale, "/updates")} />

        {!ok && <LoadFailed message={t.loadFailed} />}

        {ok && !featured && (
          <EmptyState
            icon={Newspaper}
            title={t.news.emptyTitle}
            body={t.news.emptyBody}
            action={{ href: localizePath(locale, "/contact"), label: t.news.emptyAction }}
          />
        )}

        {featured && (
          <div className="flex flex-col gap-16">
            <PostCard post={featured} locale={locale} featured featuredLabel={t.news.featured} />
            {rest.length > 0 && (
              <div className="grid gap-x-8 gap-y-14 border-t border-border pt-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.id} post={post} locale={locale} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  )
}
