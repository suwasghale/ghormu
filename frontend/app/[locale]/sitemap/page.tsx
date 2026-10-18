import Link from "next/link"

import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import { footerColumns, mainNav, type NavLink } from "@/config/navigation"
import legal from "@/content/legal"
import { getDictionary, localizePath, type Locale } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].sitemap
  return pageMetadata(locale, "/sitemap", t.title, t.lead)
}

const hrefFor = (locale: Locale, link: NavLink) => (link.localized === false ? link.href : localizePath(locale, link.href))

/**
 * Every page, grouped as the navbar groups them, built from the same
 * navigation config: a page added to the menu appears here too.
 */
export default async function SitemapPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = legal[locale].sitemap
  const dict = getDictionary(locale)

  const inNavbar = new Set(mainNav.flatMap((item) => [item.href, ...(item.children ?? []).map((child) => child.href)]))
  const footerOnly = footerColumns.flatMap((column) => column.links).filter((link) => !inNavbar.has(link.href))

  const groups = [
    ...mainNav.map((item) => ({ title: dict.nav[item.key], links: item.children ?? [item] })),
    { title: t.other, links: footerOnly },
  ]

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [[t.title, "/sitemap"]])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      <Section>
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-xl font-semibold">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5 border-l border-border pl-4">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={hrefFor(locale, link)} className="text-muted-foreground hover:text-brand">
                      {dict.nav[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Section>
    </>
  )
}
