"use client"

import { RotateCw } from "lucide-react"
import { useEffect, useState } from "react"

import type { Locale } from "@/lib/i18n/config"

/** Reload: the page the visitor wanted, now the signal may be back. */
export function RetryButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={className}>
      <RotateCw aria-hidden="true" className="size-4" />
      {label}
    </button>
  )
}

/**
 * The pages the service worker (public/sw.js) has saved on this device, in
 * this language, so a visitor offline can see what still opens.
 */
export function SavedPages({
  locale,
  labels,
  empty,
}: {
  locale: Locale
  /** Locale-less path → page name, for the pages the navigation knows. */
  labels: Record<string, string>
  empty: string
}) {
  const [paths, setPaths] = useState<string[] | null>(null)

  useEffect(() => {
    if (!("caches" in window)) return

    void (async () => {
      const names = (await caches.keys()).filter((name) => name.startsWith("ghormu-pages-"))
      const found = new Set<string>()

      for (const name of names) {
        for (const request of await (await caches.open(name)).keys()) {
          const path = new URL(request.url).pathname
          if (path.startsWith(`/${locale}`) && !path.endsWith("/offline")) found.add(path)
        }
      }

      setPaths([...found].sort())
    })()
  }, [locale])

  if (paths === null) return null
  if (paths.length === 0) return <p className="leading-relaxed text-muted-foreground">{empty}</p>

  return (
    <ul className="divide-y divide-border border-y border-border">
      {paths.map((path) => {
        const bare = path.slice(locale.length + 1) || "/"
        const name = labels[bare] ?? decodeURIComponent(bare.split("/").pop() ?? bare).replaceAll("-", " ")
        return (
          <li key={path}>
            {/* A full page load, which the service worker answers from the saved copy. */}
            <a href={path} className="flex items-center justify-between gap-4 py-3.5 font-medium hover:text-brand">
              <span className="first-letter:uppercase">{name}</span>
              <span aria-hidden="true" className="text-muted-foreground">
                →
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
