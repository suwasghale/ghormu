import type { Metadata } from "next"
import { WifiOff } from "lucide-react"

import { RetryButton, SavedPages } from "@/components/site/saved-pages"
import { buttonStyles, Container } from "@/components/site/section"
import { linkedPages } from "@/config/navigation"
import { getDictionary } from "@/lib/i18n"
import { pageLocale } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await pageLocale(params)
  return { title: getDictionary(locale).offline.title, robots: { index: false, follow: false } }
}

/**
 * Shown by the service worker (public/sw.js) when a page cannot be loaded and
 * has no saved copy. Saved on every device when the worker installs, so it
 * draws without a network: no photos, styles inlined in the HTML.
 */
export default async function OfflinePage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const dict = getDictionary(locale)
  const t = dict.offline

  const labels = Object.fromEntries([["/", dict.nav.home], ...[...linkedPages].map(([path, key]) => [path, dict.nav[key]])])

  return (
    <Container className="py-20 sm:py-28">
      <div className="grid gap-14 lg:grid-cols-[1fr_22rem] lg:gap-20">
        <div className="max-w-xl">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-ink text-earth-bright">
            <WifiOff aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-8 text-sm font-semibold tracking-wide text-earth">{t.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.body}</p>
          <RetryButton label={t.retry} className={`${buttonStyles.primary} mt-8`} />
        </div>

        <section aria-labelledby="saved-title">
          <h2 id="saved-title" className="font-display text-xl font-semibold">
            {t.savedTitle}
          </h2>
          <div className="mt-4">
            <SavedPages locale={locale} labels={labels} empty={t.savedNone} />
          </div>
        </section>
      </div>
    </Container>
  )
}
