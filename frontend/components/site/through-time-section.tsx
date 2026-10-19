import { listArchive } from "@/lib/api/content"
import archive from "@/content/archive"
import { timeFrames } from "@/lib/archive"
import type { Locale } from "@/lib/i18n/config"

import { Section, SectionHeader, type Tone } from "./section"
import { ThroughTime } from "./through-time"

/**
 * "Ghormu through time", wherever it appears. Renders nothing until at
 * least two dated satellite images are published, so pages never show an
 * empty comparison.
 */
export async function ThroughTimeSection({ locale, tone = "mist" }: { locale: Locale; tone?: Tone }) {
  const { items } = await listArchive(locale, "satellite")
  const frames = timeFrames(locale, items)

  if (frames.length < 2) return null

  const t = archive[locale].throughTime

  return (
    <Section tone={tone} labelledBy="through-time-title">
      <SectionHeader id="through-time-title" title={t.title} lead={t.lead} />
      <div className="reveal mt-10">
        <ThroughTime frames={frames} strings={t} />
      </div>
    </Section>
  )
}
