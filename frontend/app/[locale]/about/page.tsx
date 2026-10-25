import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Faq } from "@/components/site/faq"
import { PageHero } from "@/components/site/page-hero"
import { Section, SectionHeader } from "@/components/site/section"
import about from "@/content/about"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { photos } from "@/content/photos"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/about", about[locale].title, about[locale].lead, photos.terraces)
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = about[locale]
  const dict = getDictionary(locale)
  const facts = t.facts.filter((fact) => fact.value)

  return (
    <>
      <PageHero
        photo={{ photo: photos.terraces, locale }}
        crumbs={crumbs(locale, [[t.title, "/about"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        title={t.title}
        lead={t.lead}
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <div className="flex flex-col gap-14">
            {t.story.map((part, index) => (
              <article key={part.title} className="reveal" aria-labelledby={`story-${index}`}>
                <h2 id={`story-${index}`} className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {part.title}
                </h2>
                {part.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>

          {facts.length > 0 && (
            <aside aria-labelledby="facts-title" className="reveal h-fit rounded-2xl bg-brand-muted p-6 lg:sticky lg:top-24">
              <h2 id="facts-title" className="font-display text-xl font-semibold">
                {t.factsTitle}
              </h2>
              <dl className="mt-5 divide-y divide-brand/10">
                {facts.map((fact) => (
                  <div key={fact.label} className="py-3">
                    <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-0.5 font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>
      </Section>

      <Section tone="mist" labelledBy="more-title">
        <SectionHeader id="more-title" title={t.moreTitle} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {t.more.map((item) => (
            <li key={item.href} className="reveal">
              <Link
                href={localizePath(locale, item.href)}
                className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-border bg-background p-6 transition hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span>
                  <span className="block font-display text-xl font-semibold">{item.title}</span>
                  <span className="mt-2 block leading-relaxed text-muted-foreground">{item.body}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-brand transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="faq-title">
        <div className="mx-auto max-w-3xl">
          <SectionHeader id="faq-title" title={t.faqTitle} align="center" />
          <div className="reveal mt-10">
            <Faq items={t.faq} />
          </div>
        </div>
      </Section>
    </>
  )
}
