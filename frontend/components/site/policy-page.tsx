import { PageHero, type Crumb } from "./page-hero"
import { Container } from "./section"

/** Privacy policy and terms: numbered sections in a narrow reading column. */
export function PolicyPage({
  crumbs,
  breadcrumbLabel,
  title,
  lead,
  updated,
  sections,
}: {
  crumbs: Crumb[]
  breadcrumbLabel: string
  title: string
  lead: string
  updated: string
  sections: { title: string; body: string[] }[]
}) {
  return (
    <>
      <PageHero crumbs={crumbs} breadcrumbLabel={breadcrumbLabel} title={title} lead={lead} />
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground">{updated}</p>
          <div className="mt-10 flex flex-col gap-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  )
}
