"use client"

import Link from "next/link"
import { useState } from "react"

import type { ArchiveItem } from "@/lib/api/content"

import { ContentImage } from "./content-ui"

type Kind = Exclude<ArchiveItem["kind"], "satellite">

/** An item with its link and date already written out by the server. */
export type ExplorerItem = ArchiveItem & { href: string; dateText: string }

export type ExplorerGroup = { key: string; label: string; items: ExplorerItem[] }

export type ArchiveExplorerStrings = {
  all: string
  kinds: Record<ArchiveItem["kind"], string>
}

const KINDS: Kind[] = ["photo", "document", "map"]

/**
 * The collection, filterable by kind and grouped by decade, oldest first.
 *
 * Filtering happens in the browser: the archive is small enough to send
 * whole, and the page stays static. All text, dates included, arrives
 * finished from the server, because browsers do not agree on Nepali digits
 * and a mismatch would undo the server's ३ into a 3 on hydration.
 */
export function ArchiveExplorer({ groups, strings }: { groups: ExplorerGroup[]; strings: ArchiveExplorerStrings }) {
  const [kind, setKind] = useState<Kind | "all">("all")

  const present = KINDS.filter((k) => groups.some((group) => group.items.some((item) => item.kind === k)))
  const shown = groups
    .map((group) => ({ ...group, items: kind === "all" ? group.items : group.items.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0)

  return (
    <div>
      {present.length > 1 && (
        <div role="group" aria-label={strings.all} className="flex flex-wrap gap-2">
          {(["all", ...present] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {option === "all" ? strings.all : strings.kinds[option]}
            </button>
          ))}
        </div>
      )}

      {shown.map((group) => (
        <section key={group.key} aria-labelledby={`decade-${group.key}`} className="mt-12 first-of-type:mt-10">
          <h3 id={`decade-${group.key}`} className="flex items-center gap-4 font-display text-xl font-semibold">
            {group.label}
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </h3>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                    <ContentImage src={item.image_url} alt={item.title} className="h-full w-full transition duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {strings.kinds[item.kind]}
                    {item.dateText && <> · {item.dateText}</>}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold group-hover:text-brand">{item.title}</p>
                  {item.place && <p className="text-sm text-muted-foreground">{item.place}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
