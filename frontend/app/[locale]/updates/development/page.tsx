import { CalendarCheck2, CalendarClock, Construction, HandCoins, Wallet } from "lucide-react"

import { ContentImage, EmptyState, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import { SubNav } from "@/components/site/sub-nav"
import updates from "@/content/updates"
import { listProjects, type Project } from "@/lib/api/content"
import { getDictionary, localizePath, type Locale } from "@/lib/i18n"
import { formatDay, formatNumber, formatRupees } from "@/lib/i18n/format"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"
import { updatesTabs } from "@/lib/i18n/sections"
import { cn } from "@/lib/utils"
import { photos } from "@/content/photos"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = updates[locale].development
  return pageMetadata(locale, "/updates/development", t.title, t.lead)
}

/** Work in progress first: it is what people come to check on. */
const STAGE_ORDER: Project["stage"][] = ["ongoing", "planned", "completed"]

const STAGE_STYLES: Record<Project["stage"], string> = {
  ongoing: "bg-earth/10 text-earth",
  planned: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
}

export default async function DevelopmentPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = updates[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listProjects(locale)

  const byStage = STAGE_ORDER.map((stage) => ({ stage, projects: items.filter((project) => project.stage === stage) }))

  return (
    <>
      <PageHero
        photo={{ photo: photos.terraceWork, locale }}
        crumbs={crumbs(locale, [
          [t.news.title, "/updates"],
          [t.development.title, "/updates/development"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.development.title}
        lead={t.development.lead}
      />

      <Section className="pt-12 sm:pt-16">
        <SubNav label={dict.nav.updates} links={updatesTabs(locale)} current={localizePath(locale, "/updates/development")} />

        {!ok && <LoadFailed message={t.loadFailed} />}

        {ok && items.length === 0 && (
          <EmptyState icon={Construction} title={t.development.emptyTitle} body={t.development.emptyBody} />
        )}

        {items.length > 0 && (
          <>
            <dl className="grid grid-cols-3 gap-3 sm:gap-4">
              {byStage.map(({ stage, projects }) => (
                <div key={stage} className="rounded-2xl border border-border p-4 sm:p-6">
                  <dt className="text-sm text-muted-foreground">{t.development.stages[stage]}</dt>
                  <dd className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{formatNumber(locale, projects.length)}</dd>
                </div>
              ))}
            </dl>

            {byStage
              .filter(({ projects }) => projects.length > 0)
              .map(({ stage, projects }) => (
                <section key={stage} aria-labelledby={`stage-${stage}`} className="mt-16">
                  <h2 id={`stage-${stage}`} className="font-display text-2xl font-semibold">
                    {t.development.stages[stage]}
                  </h2>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} locale={locale} t={t.development} />
                    ))}
                  </div>
                </section>
              ))}
          </>
        )}
      </Section>
    </>
  )
}

function ProjectCard({ project, locale, t }: { project: Project; locale: Locale; t: (typeof updates)["ne"]["development"] }) {
  const day = (date: string) => formatDay(locale, date, { day: "numeric", month: "long", year: "numeric" })

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border sm:flex-row">
      {project.image_url && (
        <div className="aspect-[16/10] sm:aspect-auto sm:w-48 sm:shrink-0">
          <ContentImage src={project.image_url} alt="" className="h-full w-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold", STAGE_STYLES[project.stage])}>
          {t.stages[project.stage]}
        </span>
        <h3 className="mt-3 font-display text-xl font-semibold text-balance">{project.title}</h3>
        {project.summary && <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{project.summary}</p>}

        {project.progress !== null && (
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.progress}</span>
              <span className="font-semibold">{formatNumber(locale, project.progress)}%</span>
            </div>
            <div
              role="progressbar"
              aria-label={t.progress}
              aria-valuenow={project.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-earth" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        )}

        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {project.budget_npr !== null && (
            <Fact icon={Wallet} label={t.budget} value={formatRupees(locale, project.budget_npr)} />
          )}
          {project.funding && <Fact icon={HandCoins} label={t.funding} value={project.funding} />}
          {project.started_on && <Fact icon={CalendarClock} label={t.started} value={day(project.started_on)} />}
          {project.completed_on && <Fact icon={CalendarCheck2} label={t.completed} value={day(project.completed_on)} />}
        </dl>
      </div>
    </article>
  )
}

function Fact({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  )
}
