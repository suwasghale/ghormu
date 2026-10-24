import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Droplets,
  Moon,
  Mountain,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react"

import type travelGuide from "@/content/travel-guide"
import type { Locale } from "@/lib/i18n/config"
import { formatDay } from "@/lib/i18n/dates"
import { formatClock, formatNumber } from "@/lib/i18n/format"
import { cn } from "@/lib/utils"
import { conditionFor, type Condition, type Forecast } from "@/lib/weather"

import { Eyebrow } from "./section"

const ICONS: Record<Condition, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: Moon },
  partly: { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: CloudSnow, night: CloudSnow },
  showers: { day: CloudRainWind, night: CloudRainWind },
  thunder: { day: CloudLightning, night: CloudLightning },
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step

/**
 * Current conditions and the week ahead in Ghormu, rendered on the server.
 * Without a forecast (service down) it says so, in the same frame.
 */
export function WeatherPanel({
  locale,
  forecast,
  t,
}: {
  locale: Locale
  forecast: Forecast | null
  t: (typeof travelGuide)["ne"]["weather"]
}) {
  const degrees = (value: number) => `${formatNumber(locale, Math.round(value))}°`

  if (!forecast) {
    return (
      <div className="rounded-[2rem] bg-ink p-8 text-ink-foreground sm:p-10">
        <Eyebrow tone="ink">{t.eyebrow}</Eyebrow>
        <h2 id="weather-title" className="mt-4 font-display text-3xl font-semibold">
          {t.title}
        </h2>
        <p className="mt-4 max-w-xl text-lg text-ink-foreground/75">{t.unavailable}</p>
      </div>
    )
  }

  const { current, days } = forecast
  const condition = conditionFor(current.code)
  const CurrentIcon = ICONS[condition][current.isDay ? "day" : "night"]
  const today = days[0]

  const weekMin = Math.min(...days.map((day) => day.min))
  const weekMax = Math.max(...days.map((day) => day.max))
  const span = Math.max(weekMax - weekMin, 1)

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Thermometer, label: t.feelsLike, value: degrees(current.feelsLike) },
    { icon: Droplets, label: t.humidity, value: `${formatNumber(locale, current.humidity)}%` },
    { icon: Wind, label: t.wind, value: `${formatNumber(locale, Math.round(current.windSpeed))} km/h` },
    { icon: Umbrella, label: t.rain, value: `${formatNumber(locale, current.precipitation)} mm` },
    ...(today
      ? [
          { icon: Sunrise, label: t.sunrise, value: formatClock(locale, today.sunrise) },
          { icon: Sunset, label: t.sunset, value: formatClock(locale, today.sunset) },
        ]
      : []),
  ]

  return (
    <div className="grid overflow-hidden rounded-[2rem] bg-ink text-ink-foreground lg:grid-cols-[1.15fr_1fr]">
      {/* Now */}
      <div className="flex flex-col p-8 sm:p-10">
        <Eyebrow tone="ink">
          <span className="relative mr-1 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-earth-bright opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-earth-bright" />
          </span>
          {t.eyebrow}
        </Eyebrow>
        <h2 id="weather-title" className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
          {t.title}
        </h2>

        <div className="mt-8 flex items-center gap-6">
          <CurrentIcon aria-hidden="true" className="size-16 shrink-0 text-earth-bright sm:size-20" strokeWidth={1.4} />
          <div>
            <p className="font-display text-6xl leading-none font-semibold sm:text-7xl">{degrees(current.temperature)}</p>
            <p className="mt-2 text-lg text-ink-foreground/80">{t.conditions[condition]}</p>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {details.map(({ icon: Icon, label, value }) => (
            // A <dl> group may hold only <dt> and <dd>, so the icon sits in the term.
            <div key={label}>
              <dt className="flex items-center gap-2 text-sm text-ink-foreground/70">
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {label}
              </dt>
              <dd className="mt-0.5 pl-6 font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto pt-10 text-sm text-ink-foreground/60">
          <p className="flex items-center gap-2">
            <Mountain aria-hidden="true" className="size-4 shrink-0" />
            {t.elevation}: {t.elevationValue.replace("{m}", formatNumber(locale, roundTo(forecast.elevation, 10)))}
          </p>
          <p className="mt-2">
            {t.updated}: {formatClock(locale, current.time)} ({t.nepalTime}) · {t.credit}:{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-earth-bright"
            >
              Open-Meteo.com
            </a>
          </p>
        </div>
      </div>

      {/* Week ahead */}
      <div className="border-t border-ink-foreground/10 bg-ink-foreground/[0.03] p-8 sm:p-10 lg:border-t-0 lg:border-l">
        <h3 className="text-sm font-semibold text-ink-foreground/70">{t.forecastTitle}</h3>
        <ul className="mt-4 divide-y divide-ink-foreground/10">
          {days.map((day, index) => {
            const dayCondition = conditionFor(day.code)
            const Icon = ICONS[dayCondition].day
            return (
              <li key={day.date} className="grid grid-cols-[3.25rem_1.5rem_2.5rem_1fr] items-center gap-2 py-3 sm:grid-cols-[5rem_1.75rem_3.5rem_1fr] sm:gap-3">
                <span className="font-medium">
                  {index === 0 ? t.today : formatDay(locale, day.date, { weekday: "short" })}
                </span>
                <Icon aria-label={t.conditions[dayCondition]} role="img" className="size-5 text-earth-bright" />
                <span
                  className={cn("text-sm", (day.rainChance ?? 0) >= 40 ? "text-sky-300" : "text-ink-foreground/70")}
                  title={t.rainChance}
                >
                  {day.rainChance !== null && (
                    <>
                      <span className="sr-only">{t.rainChance}: </span>
                      {formatNumber(locale, day.rainChance)}%
                    </>
                  )}
                </span>
                <span className="flex items-center gap-2 text-sm sm:gap-3">
                  <span className="w-7 text-right text-ink-foreground/55 sm:w-8">{degrees(day.min)}</span>
                  <span aria-hidden="true" className="relative h-1.5 flex-1 rounded-full bg-ink-foreground/10">
                    <span
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand to-earth"
                      style={{ left: `${((day.min - weekMin) / span) * 100}%`, width: `${((day.max - day.min) / span) * 100}%` }}
                    />
                  </span>
                  <span className="w-7 font-medium sm:w-8">{degrees(day.max)}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-ink-foreground/55">{t.note}</p>
      </div>
    </div>
  )
}
