import Link from "next/link"
import { Camera } from "lucide-react"

import { ContentImage, EmptyState, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import archive from "@/content/archive"
import { listArchive } from "@/lib/api/content"
import { itemDate } from "@/lib/archive"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale].gallery
  return pageMetadata(locale, "/explore/gallery", t.title, t.lead)
}

/**
 * Every published photograph, newest first, at its own proportions. The
 * same photos as the archive, shown as pictures rather than records.
 */
export default async function GalleryPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listArchive(locale, "photo")
  const photos = [...items].reverse().filter((item) => item.image_url)

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [dict.nav.explore, "/explore"],
          [t.gallery.title, "/explore/gallery"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.gallery.eyebrow}
        title={t.gallery.title}
        lead={t.gallery.lead}
      />

      <Section className="pt-12 sm:pt-16">
        {!ok && <LoadFailed message={t.loadFailed} />}

        {ok && photos.length === 0 && (
          <EmptyState
            icon={Camera}
            title={t.gallery.emptyTitle}
            body={t.gallery.emptyBody}
            action={{ href: `${localizePath(locale, "/contact")}?topic=archive`, label: t.gallery.emptyAction }}
          />
        )}

        {photos.length > 0 && (
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {photos.map((photo) => (
              <li key={photo.id} className="mb-4 break-inside-avoid">
                <Link
                  href={localizePath(locale, `/about/archive/${photo.slug}`)}
                  className="group relative block overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  <ContentImage src={photo.image_url} alt={photo.title} className="w-full transition duration-700 group-hover:scale-[1.02]" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="block font-display text-lg font-semibold">{photo.title}</span>
                    <span className="text-sm text-white/80">{itemDate(locale, photo)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
