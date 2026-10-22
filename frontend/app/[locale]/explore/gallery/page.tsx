import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { ContentImage, LoadFailed } from "@/components/site/content-ui"
import { PageHero } from "@/components/site/page-hero"
import { PhotoCredit, PhotoImage } from "@/components/site/photo"
import { Section, SectionHeader } from "@/components/site/section"
import archive from "@/content/archive"
import { galleryOrder, photos, photoSources } from "@/content/photos"
import { listArchive } from "@/lib/api/content"
import { itemDate } from "@/lib/archive"
import { getDictionary, localizePath } from "@/lib/i18n"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

export const revalidate = 300

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale].gallery
  return pageMetadata(locale, "/explore/gallery", t.title, t.lead, photos.village)
}

/**
 * Photographs of Ghormu at their own proportions, each credited: first the
 * site's own collection, then photos published to the archive from the
 * admin, newest first.
 */
export default async function GalleryPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = archive[locale]
  const dict = getDictionary(locale)
  const { items, ok } = await listArchive(locale, "photo")
  const archivePhotos = [...items].reverse().filter((item) => item.image_url)

  return (
    <>
      <PageHero
        photo={{ photo: photos.village, locale }}
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
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {galleryOrder.map((name) => {
            const photo = photos[name]
            return (
              <li key={name} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-muted">
                <figure>
                  <PhotoImage
                    photo={photo}
                    locale={locale}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    credit="none"
                    className="transition duration-700 group-hover:scale-[1.02]"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-14 text-white">
                    <span className="text-sm leading-snug opacity-0 transition group-hover:opacity-100">{photo.alt[locale]}</span>
                    <PhotoCredit photo={photo} locale={locale} className="shrink-0 bg-black/30" />
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>

        <aside className="mt-10 rounded-2xl bg-muted p-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{t.gallery.creditsTitle}</p>
          <p className="mt-1">{t.gallery.creditsBody}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {Object.values(photoSources).map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
                  {source.name}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </Section>

      {(archivePhotos.length > 0 || !ok) && (
        <Section tone="mist" labelledBy="archive-photos-title">
          <SectionHeader id="archive-photos-title" title={t.gallery.archiveTitle} />
          {!ok && (
            <div className="mt-8">
              <LoadFailed message={t.loadFailed} />
            </div>
          )}
          <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {archivePhotos.map((photo) => (
              <li key={photo.id} className="mb-4 break-inside-avoid">
                <Link
                  href={localizePath(locale, `/about/archive/${photo.slug}`)}
                  className="group relative block overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  <ContentImage src={photo.image_url} alt={photo.title} className="w-full transition duration-700 group-hover:scale-[1.02]" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
                    <span className="block font-display text-lg font-semibold">{photo.title}</span>
                    <span className="text-sm text-white/80">
                      {[itemDate(locale, photo), photo.credit].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}
