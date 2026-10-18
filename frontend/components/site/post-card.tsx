import Link from "next/link"
import { ArrowUpRight, Paperclip, Pin } from "lucide-react"

import type { Post } from "@/lib/api/content"
import { localizePath, type Locale } from "@/lib/i18n/config"
import { formatDate, formatNumber } from "@/lib/i18n/format"
import { cn } from "@/lib/utils"

import { ContentImage } from "./content-ui"

/** A news story in a grid; `featured` lays it out wide, image beside text. */
export function PostCard({ post, locale, featured = false, featuredLabel }: { post: Post; locale: Locale; featured?: boolean; featuredLabel?: string }) {
  return (
    <article className={cn("group relative", featured && "grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center")}>
      <div className="aspect-[16/10] overflow-hidden rounded-3xl">
        <ContentImage src={post.image_url} alt="" className="h-full w-full transition duration-700 group-hover:scale-[1.03]" priority={featured} />
      </div>
      <div className={cn(!featured && "mt-5")}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {featured && featuredLabel && <span className="font-semibold text-earth">{featuredLabel} ·</span>}
          <time dateTime={post.published_at}>{formatDate(locale, post.published_at)}</time>
        </p>
        <h2 className={cn("mt-2 font-display font-semibold tracking-tight text-balance", featured ? "text-3xl sm:text-4xl" : "text-xl")}>
          <Link
            href={localizePath(locale, `/updates/${post.slug}`)}
            className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {post.title}
          </Link>
        </h2>
        {post.summary && (
          <p className={cn("mt-3 leading-relaxed text-muted-foreground", featured ? "text-lg" : "line-clamp-3")}>{post.summary}</p>
        )}
        <ArrowUpRight aria-hidden="true" className="mt-4 size-5 text-brand transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </article>
  )
}

/** A notice as one row: date block, title and badges. */
export function NoticeRow({
  post,
  locale,
  pinnedLabel,
  attachmentLabel,
}: {
  post: Post
  locale: Locale
  pinnedLabel: string
  attachmentLabel: string
}) {
  const published = new Date(post.published_at)
  const day = formatNumber(locale, Number(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "Asia/Kathmandu" }).format(published)))
  const month = formatDate(locale, post.published_at, { month: "short" })
  const year = formatDate(locale, post.published_at, { year: "numeric" })

  return (
    <article className="group relative flex gap-5 py-6 sm:gap-8">
      <time dateTime={post.published_at} className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-brand-muted py-3 text-brand sm:w-20">
        <span className="font-display text-2xl leading-none font-bold sm:text-3xl">{day}</span>
        <span className="mt-1 text-xs font-semibold">{month}</span>
        <span className="text-xs opacity-70">{year}</span>
      </time>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {post.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-earth/10 px-2.5 py-0.5 text-xs font-semibold text-earth">
              <Pin aria-hidden="true" className="size-3" />
              {pinnedLabel}
            </span>
          )}
        </div>
        <h2 className="mt-1 font-display text-xl font-semibold text-balance">
          <Link
            href={localizePath(locale, `/updates/${post.slug}`)}
            className="after:absolute after:inset-0 group-hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {post.title}
          </Link>
        </h2>
        {post.summary && <p className="mt-1.5 leading-relaxed text-muted-foreground">{post.summary}</p>}
        {post.attachment_url && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Paperclip aria-hidden="true" className="size-4" />
            {attachmentLabel}
          </p>
        )}
      </div>
    </article>
  )
}
