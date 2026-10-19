import Link from "next/link"
import { CloudOff, ImageIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { buttonStyles } from "./section"

/**
 * Pieces shared by pages whose content comes from the admin.
 */

/** Shown when a list has nothing yet: says so plainly and offers a next step. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-3xl border border-dashed border-border px-6 py-14 text-center sm:py-20", className)}>
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-brand-muted text-brand">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="mx-auto mt-5 max-w-md font-display text-xl font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">{body}</p>
      {action && (
        <Link href={action.href} className={cn(buttonStyles.secondary, "mt-7")}>
          {action.label}
        </Link>
      )}
    </div>
  )
}

/** The content service could not be reached; the page will heal on its own. */
export function LoadFailed({ message }: { message: string }) {
  return (
    <p role="status" className="flex items-center gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-amber-900 ring-1 ring-amber-600/20">
      <CloudOff aria-hidden="true" className="size-5 shrink-0" />
      {message}
    </p>
  )
}

/**
 * An image from the admin, or a drawn placeholder when there is none.
 *
 * A plain <img>: uploads are served from the site's own /api/media/ path or
 * the media host, already resized and re-encoded to WebP on upload, so the
 * Next image optimiser would only add a second copy.
 */
export function ContentImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  if (!src) {
    return (
      <div aria-hidden="true" className={cn("relative isolate flex items-center justify-center overflow-hidden bg-brand-muted text-brand/40", className)}>
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see above
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
    />
  )
}

/**
 * Rich text written in the admin. The backend sanitises it on every save
 * (core.content.sanitize), so only the tags the editor can produce arrive.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-ghormu", className)} dangerouslySetInnerHTML={{ __html: html }} />
}
