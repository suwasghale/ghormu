import { Check } from "lucide-react"

import { ContactForm } from "@/components/site/contact-form"
import { PageHero } from "@/components/site/page-hero"
import { PhotoImage } from "@/components/site/photo"
import { ArrowLink, Section } from "@/components/site/section"
import contact from "@/content/contact"
import { photos } from "@/content/photos"
import support from "@/content/support"
import updates from "@/content/updates"
import { listProjects } from "@/lib/api/content"
import { getDictionary, localizePath } from "@/lib/i18n"
import { formatIndex } from "@/lib/i18n/config"
import { formatNumber, formatRupees } from "@/lib/i18n/format"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

/** Lists live projects, so it refreshes with them. */
export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  return pageMetadata(locale, "/support", support[locale].title, support[locale].lead, photos.khata)
}

const headingClass = "font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"

export default async function SupportPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = support[locale]
  const dict = getDictionary(locale)
  const { items } = await listProjects(locale)
  const needs = items.filter((project) => project.stage !== "completed").slice(0, 4)

  return (
    <>
      <PageHero
        photo={{ photo: photos.khata, locale }}
        crumbs={crumbs(locale, [[t.title, "/support"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      {/* Why */}
      <Section labelledBy="why-title" className="py-24 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[6fr_5fr] lg:gap-20">
          <div className="reveal max-w-xl">
            <h2 id="why-title" className={headingClass}>
              {t.why.title}
            </h2>
            {t.why.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-6 text-lg leading-[1.8] text-foreground/80">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="reveal relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <PhotoImage photo={photos.play} locale={locale} fill sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        </div>
      </Section>

      {/* Where help is needed */}
      <Section tone="mist" labelledBy="needs-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="reveal max-w-xl">
            <h2 id="needs-title" className={headingClass}>
              {t.needs.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.needs.lead}</p>
          </div>
          <ArrowLink href={localizePath(locale, "/updates/development")} className="reveal shrink-0">
            {t.needs.all}
          </ArrowLink>
        </div>

        {needs.length > 0 ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {needs.map((project) => (
              <li key={project.id} className="reveal rounded-2xl bg-background p-6 ring-1 ring-border sm:p-8">
                <p className="text-sm font-semibold text-earth">{updates[locale].development.stages[project.stage]}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-balance">{project.title}</h3>
                {project.summary && <p className="mt-2 line-clamp-3 leading-relaxed text-muted-foreground">{project.summary}</p>}
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  {project.budget_npr !== null && (
                    <p>
                      <span className="text-muted-foreground">{t.needs.budget}: </span>
                      <span className="font-semibold">{formatRupees(locale, project.budget_npr)}</span>
                    </p>
                  )}
                  {project.progress !== null && (
                    <p>
                      <span className="text-muted-foreground">{t.needs.progress}: </span>
                      <span className="font-semibold">{formatNumber(locale, project.progress)}%</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reveal mt-10 max-w-2xl rounded-2xl bg-background p-6 leading-relaxed text-muted-foreground ring-1 ring-border">
            {t.needs.empty}
          </p>
        )}
      </Section>

      {/* Ways to help */}
      <Section labelledBy="ways-title" className="py-24 sm:py-32">
        <h2 id="ways-title" className={`${headingClass} reveal`}>
          {t.ways.title}
        </h2>
        <ol className="mt-12 grid border-t border-border md:grid-cols-2">
          {t.ways.items.map((way, index) => (
            <li key={way.title} className="reveal border-b border-border py-8 md:odd:border-r md:odd:pr-10 md:even:pl-10">
              <span className="font-display text-sm text-earth">{formatIndex(locale, index + 1)}</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">{way.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">{way.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Promise and form */}
      <section aria-labelledby="form-title" className="bg-ink py-24 text-ink-foreground sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[5fr_6fr] lg:gap-20">
          <div className="reveal">
            <h2 className={headingClass}>{t.promises.title}</h2>
            <ul className="mt-8 flex flex-col gap-5">
              {t.promises.items.map((promise) => (
                <li key={promise} className="flex items-start gap-4 text-lg leading-relaxed text-ink-foreground/85">
                  <Check aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-earth" />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-3xl bg-background p-6 text-foreground sm:p-10">
            <h2 id="form-title" className="font-display text-2xl font-semibold">
              {t.form.title}
            </h2>
            <p className="mt-2 mb-8 text-muted-foreground">{t.form.lead}</p>
            <ContactForm locale={locale} strings={contact[locale].form} defaultTopic="support" privacyHref={localizePath(locale, "/privacy")} />
          </div>
        </div>
      </section>
    </>
  )
}
