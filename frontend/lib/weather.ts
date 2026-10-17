import { z } from "zod"

import { ghormu } from "@/config/place"

/**
 * Weather for Ghormu from Open-Meteo (open-meteo.com).
 *
 * Free for non-commercial use with attribution (CC BY 4.0), no API key.
 * Fetched on the server and cached for half an hour, so visitors never call
 * the service themselves: pages stay static and fast, and traffic spikes
 * cannot exhaust the free quota. Returns `null` when the service is down or
 * answers in an unexpected shape; pages show a fallback instead of failing.
 */

export const WEATHER_REVALIDATE_SECONDS = 1800

const forecastSchema = z.object({
  elevation: z.number(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number(),
    is_day: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().nullable()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
  }),
})

export type Forecast = {
  /** Metres above sea level of the forecast point (90 m terrain model). */
  elevation: number
  current: {
    /** Local Nepal time, `YYYY-MM-DDTHH:MM`. */
    time: string
    temperature: number
    feelsLike: number
    humidity: number
    code: number
    windSpeed: number
    precipitation: number
    isDay: boolean
  }
  days: {
    /** Local date, `YYYY-MM-DD`. */
    date: string
    code: number
    max: number
    min: number
    rainChance: number | null
    sunrise: string
    sunset: string
  }[]
}

export const forecastUrl =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: String(ghormu.latitude),
    longitude: String(ghormu.longitude),
    timezone: ghormu.timeZone,
    forecast_days: "7",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
  })

/** Shape Open-Meteo's parallel arrays into one object per day. */
export function parseForecast(json: unknown): Forecast | null {
  const parsed = forecastSchema.safeParse(json)
  if (!parsed.success) return null

  const { elevation, current, daily } = parsed.data

  return {
    elevation,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      code: current.weather_code,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      isDay: current.is_day === 1,
    },
    days: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      rainChance: daily.precipitation_probability_max[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    })),
  }
}

export async function getForecast(): Promise<Forecast | null> {
  try {
    const response = await fetch(forecastUrl, {
      next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    return parseForecast(await response.json())
  } catch {
    return null
  }
}

export type Condition =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "showers"
  | "thunder"

/** Group WMO weather codes into the handful of conditions we name and draw. */
export function conditionFor(code: number): Condition {
  if (code === 0) return "clear"
  if (code <= 2) return "partly"
  if (code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code >= 51 && code <= 57) return "drizzle"
  if (code >= 61 && code <= 67) return "rain"
  if (code >= 71 && code <= 77) return "snow"
  if (code >= 80 && code <= 82) return "showers"
  if (code === 85 || code === 86) return "snow"
  if (code >= 95) return "thunder"
  return "cloudy"
}
