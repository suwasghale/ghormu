import {
  Ambulance,
  Baby,
  Flame,
  HeartHandshake,
  Phone,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react"

import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/section"
import contact, { emergencyNumbers } from "@/content/contact"
import { getDictionary } from "@/lib/i18n"
import { formatNumber } from "@/lib/i18n/format"
import { crumbs, pageLocale, pageMetadata } from "@/lib/i18n/page"

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = contact[locale].emergency
  return pageMetadata(locale, "/contact/emergency", t.title, t.lead)
}

const ICONS: Record<(typeof emergencyNumbers)[number]["key"], LucideIcon> = {
  police: Siren,
  fire: Flame,
  ambulance: Ambulance,
  touristPolice: ShieldAlert,
  child: Baby,
  women: HeartHandshake,
}

export default async function EmergencyPage({ params }: PageProps) {
  const locale = await pageLocale(params)
  const t = contact[locale]
  const dict = getDictionary(locale)
  // The number is dialled as written, but shown in the page's own digits.
  const shown = (number: string) => formatNumber(locale, Number(number), { useGrouping: false })

  return (
    <>
      <PageHero
        crumbs={crumbs(locale, [
          [t.contact.title, "/contact"],
          [t.emergency.title, "/contact/emergency"],
        ])}
        breadcrumbLabel={dict.header.breadcrumb}
        eyebrow={t.eyebrow}
        title={t.emergency.title}
        lead={t.emergency.lead}
      />

      <Section className="pt-12 sm:pt-16" labelledBy="national-title">
        <h2 id="national-title" className="font-display text-2xl font-semibold sm:text-3xl">
          {t.emergency.nationalTitle}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emergencyNumbers.map(({ key, number }) => {
            const Icon = ICONS[key]
            return (
              <li key={key}>
                <a
                  href={`tel:${number}`}
                  aria-label={`${t.emergency.numbers[key]}: ${number}. ${t.emergency.call}`}
                  className="group flex items-center gap-5 rounded-3xl border border-border p-5 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700 group-hover:bg-red-100">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-muted-foreground">{t.emergency.numbers[key]}</span>
                    <span className="block font-display text-4xl leading-tight font-bold tracking-tight">{shown(number)}</span>
                  </span>
                  <Phone aria-hidden="true" className="size-5 text-red-700 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">{t.emergency.sources}</p>
      </Section>

      <Section tone="mist" labelledBy="local-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="reveal">
            <h2 id="local-title" className="font-display text-2xl font-semibold">
              {t.emergency.localTitle}
            </h2>
            {t.emergency.local.length > 0 ? (
              <ul className="mt-6 divide-y divide-border rounded-2xl bg-background px-6 ring-1 ring-border">
                {t.emergency.local.map((person) => (
                  <li key={person.phone} className="flex items-center justify-between gap-4 py-4">
                    <span>
                      <span className="block font-semibold">{person.name}</span>
                      <span className="text-sm text-muted-foreground">{person.role}</span>
                    </span>
                    <a href={`tel:${person.phone.replace(/[^\d+]/g, "")}`} className="font-medium text-brand hover:underline">
                      {person.phone}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl bg-background p-6 leading-relaxed text-muted-foreground ring-1 ring-border">
                {t.emergency.localPending}
              </p>
            )}
          </div>
          <div className="reveal">
            <h2 className="font-display text-2xl font-semibold">{t.emergency.tipsTitle}</h2>
            <ol className="mt-6 flex flex-col gap-4">
              {t.emergency.tips.map((tip, index) => (
                <li key={tip} className="flex gap-4 leading-relaxed">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm text-brand-foreground">
                    {formatNumber(locale, index + 1)}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  )
}
