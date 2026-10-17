import Link from "next/link"
import { Check, Infinity as Lasting, Link2, ShieldCheck, Sprout } from "lucide-react"

import { PageHero } from "@/components/site/page-hero"
import { buttonStyles, Section, SectionHeader } from "@/components/site/section"
import { TopoPattern } from "@/components/site/topo-pattern"
import vision from "@/content/vision"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/about/vision", vision[locale].title, vision[locale].lead)
}

const PROMISE_ICONS = [Sprout, Link2, ShieldCheck, Lasting]

export default async function VisionPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = vision[locale]
  const dict = getDictionary(locale)

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [dict.nav.about, "/about"],
          [t.title, "/about/vision"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      <Section>
        <blockquote className="reveal mx-auto max-w-4xl border-l-4 border-earth pl-6 font-display text-2xl leading-relaxed font-medium text-balance sm:pl-10 sm:text-3xl">
          {t.statement}
        </blockquote>
      </Section>

      <Section tone="mist" labelledBy="why-title">
        <SectionHeader id="why-title" title={t.whyTitle} />
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {t.why.map((item, index) => (
            <li key={item.title} className="reveal rounded-2xl bg-background p-7 ring-1 ring-border">
              <span className="font-display text-4xl font-bold text-earth/80">
                {new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en").format(index + 1)}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="promises-title">
        <SectionHeader id="promises-title" title={t.promisesTitle} align="center" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.promises.map((item, index) => {
            const Icon = PROMISE_ICONS[index]
            return (
              <li key={item.title} className="reveal rounded-2xl border border-border p-6 text-center">
                <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-brand-muted text-brand">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      <section aria-labelledby="help-title" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <TopoPattern className="absolute inset-0 -z-10 h-full w-full text-ink-foreground/[0.06]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
          <SectionHeader id="help-title" tone="ink" title={t.helpTitle} />
          <div className="reveal">
            <ul className="flex flex-col gap-4">
              {t.help.map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg">
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-earth" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={localizePath(locale, "/contact")} className={`${buttonStyles.onInk} mt-9`}>
              {t.cta}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
