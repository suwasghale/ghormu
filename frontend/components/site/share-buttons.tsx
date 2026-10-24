"use client"

import { Check, Link2, MessageCircle, Share2, ThumbsUp } from "lucide-react"
import { useState, useSyncExternalStore } from "react"

import type { Dictionary } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const noSubscription = () => () => {}

/**
 * Share a page: the device's own share sheet where there is one (phones),
 * WhatsApp and Facebook links, and copy-link. Each button says what it does
 * in words, so it is named the same for screen readers and voice control.
 */
export function ShareButtons({
  url,
  title,
  strings,
  className,
}: {
  /** The page's full address, e.g. https://ghormu.com/ne/support. */
  url: string
  title: string
  strings: Dictionary["share"]
  className?: string
}) {
  // Only known in the browser; the server renders without it.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  )
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard refused (permissions, insecure origin): the link is still
      // in the address bar, so there is nothing more to do.
    }
  }

  const chip =
    "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

  return (
    <div role="group" aria-label={strings.label} className={cn("flex flex-wrap gap-2", className)}>
      {canShare && (
        <button type="button" className={chip} onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 aria-hidden="true" className="size-4" />
          {strings.native}
        </button>
      )}
      <a className={chip} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle aria-hidden="true" className="size-4" />
        {strings.whatsapp}
      </a>
      <a
        className={chip}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ThumbsUp aria-hidden="true" className="size-4" />
        {strings.facebook}
      </a>
      <button type="button" className={chip} onClick={copy}>
        {copied ? <Check aria-hidden="true" className="size-4" /> : <Link2 aria-hidden="true" className="size-4" />}
        {copied ? strings.copied : strings.copy}
      </button>
      <span role="status" className="sr-only">
        {copied ? strings.copied : ""}
      </span>
    </div>
  )
}
