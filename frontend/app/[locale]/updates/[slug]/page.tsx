import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"

import { ContentImage, Prose } from "@/components/site/content-ui"
import { JsonLd } from "@/components/site/json-ld"
import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Container } from "@/components/site/section"
import { site } from "@/config/site"
import updates from "@/content/updates"
import { getPost } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import { alternatesFor } from "@/lib/i18n/metadata"
import { crumbs, defaultSharePhoto, pageLocale, shareCard, shareMetadata } from "@/lib/i18n/page"
import { cn } from "@/lib/utils"

/**
 * One news story or notice. Not built ahead of time: rendered on the first
 * visit, cached, and rebuilt when the post is edited in the admin.
 */
export const revalidate = 300
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ locale: string; slug: string }> }

async function load(params: PageProps["params"]) {
  const locale = await pageLocale(params)
  const { slug } = await params
  const post = await getPost(locale, slug)
  if (!post) notFound()
  return { locale, post }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, post } = await load(params)
  const path = `/updates/${post.slug}`
  const description = post.summary || getDictionary(locale).site.description
  const share = shareMetadata(
    locale,
    path,
    post.title,
    description,
    post.image_url ? { url: post.image_url, alt: post.title } : shareCard(locale, defaultSharePhoto),
  )

  return {
    title: post.title,
    description,
    alternates: alternatesFor(locale, path),
    ...share,
    openGraph: { ...share.openGraph, type: "article", publishedTime: post.published_at, modifiedTime: post.updated_at },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { locale, post } = await load(params)
  const t = updates[locale]
  const dict = getDictionary(locale)
  const isNotice = post.kind === "announcement"
  const listPath = isNotice ? "/updates/announcements" : "/updates"
  const url = (path: string) => new URL(localizePath(locale, path), site.url).toString()

  return (
    <>
      <JsonLd
        data={{
          "@type": isNotice ? "Article" : "NewsArticle",
          headline: post.title,
          description: post.summary || undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          inLanguage: locale,
          image: post.image_url ? [post.image_url.startsWith("/") ? new URL(post.image_url, site.url).toString() : post.image_url] : undefined,
          mainEntityOfPage: url(`/updates/${post.slug}`),
          publisher: { "@type": "Organization", name: dict.site.name, url: url("/") },
        }}
      />

      <PageHero
        crumbs={crumbs(locale, [
          [isNotice ? t.announcements.title : t.news.title, listPath],
          [post.title, `/updates/${post.slug}`],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={`${t.article.kinds[post.kind]} · ${formatDate(locale, post.published_at)}`}
        title={post.title}
        lead={post.summary}
      />

      <Container className="pb-24 sm:pb-32">
        <article className="mx-auto max-w-3xl">
          {post.image_url && (
            <div className="-mt-4 mb-12 aspect-[16/9] overflow-hidden rounded-3xl">
              <ContentImage src={post.image_url} alt="" className="h-full w-full" priority />
            </div>
          )}

          {post.body && <Prose html={post.body} />}

          {post.attachment_url && (
            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.primary, "mt-10")}>
              <Download aria-hidden="true" className="size-4" />
              {t.article.download}
            </a>
          )}

          <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
            <Link href={localizePath(locale, listPath)} className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {isNotice ? t.article.backNotices : t.article.back}
            </Link>
            <span>
              {t.article.published}: <time dateTime={post.published_at}>{formatDate(locale, post.published_at)}</time>
              {post.updated_at.slice(0, 10) !== post.published_at.slice(0, 10) && (
                <>
                  {" · "}
                  {t.article.updated}: <time dateTime={post.updated_at}>{formatDate(locale, post.updated_at)}</time>
                </>
              )}
            </span>
          </footer>
        </article>
      </Container>
    </>
  )
}
