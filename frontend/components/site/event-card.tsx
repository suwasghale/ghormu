import { MapPin } from "lucide-react"

import type { ContentEvent } from "@/lib/api/content"
import type { Locale } from "@/lib/i18n/config"
import { formatDay, formatDayRange } from "@/lib/i18n/dates"
import { cn } from "@/lib/utils"

/** The date, or the date range written the way each language writes ranges. */
export function eventDates(locale: Locale, event: ContentEvent): string {
  const full = { day: "numeric", month: "long", year: "numeric" } as const

  if (!event.ends_on || event.ends_on === event.starts_on) return formatDay(locale, event.starts_on, full)

  return formatDayRange(locale, event.starts_on, event.ends_on, full)
}

/** An event with a calendar-leaf date block. `compact` for past events. */
export function EventCard({
  event,
  locale,
  categoryLabel,
  compact = false,
}: {
  event: ContentEvent
  locale: Locale
  categoryLabel: string
  compact?: boolean
}) {
  return (
    <article className={cn("flex gap-5", !compact && "rounded-3xl border border-border p-5 sm:p-6")}>
      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl text-center",
          compact ? "w-14 bg-muted py-2" : "w-20 bg-brand text-brand-foreground",
        )}
      >
        <span className={cn("text-xs font-semibold", compact ? "text-muted-foreground" : "text-brand-foreground/80")}>
          {formatDay(locale, event.starts_on, { month: "short" })}
        </span>
        <span className={cn("font-display leading-none font-bold", compact ? "text-xl" : "mt-1 text-3xl")}>
          {formatDay(locale, event.starts_on, { day: "numeric" })}
        </span>
        {!compact && <span className="mt-1 text-xs text-brand-foreground/70">{formatDay(locale, event.starts_on, { weekday: "short" })}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-earth">{categoryLabel}</span> · <time dateTime={event.starts_on}>{eventDates(locale, event)}</time>
        </p>
        <h3 className={cn("mt-1 font-display font-semibold text-balance", compact ? "text-lg" : "text-xl")}>{event.title}</h3>
        {event.location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {event.location}
          </p>
        )}
        {!compact && event.description && <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">{event.description}</p>}
      </div>
    </article>
  )
}
