import { afterEach, describe, expect, it, vi } from 'vitest'

import { conditionFor, forecastUrl, getForecast, parseForecast } from './weather'

const sample = {
  elevation: 1746,
  current: {
    time: '2026-10-17T22:00', temperature_2m: 11.7, apparent_temperature: 10.9, relative_humidity_2m: 77,
    weather_code: 0, wind_speed_10m: 1.8, precipitation: 0, is_day: 0,
  },
  daily: {
    time: ['2026-10-17', '2026-10-18'],
    weather_code: [2, 45],
    temperature_2m_max: [19.5, 18.9],
    temperature_2m_min: [10.4, 10],
    precipitation_probability_max: [0, null],
    sunrise: ['2026-10-17T06:05', '2026-10-18T06:06'],
    sunset: ['2026-10-17T17:33', '2026-10-18T17:32'],
  },
}

describe('forecast', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks for Ghormu in Nepal time', () => {
    const url = new URL(forecastUrl)
    expect(url.searchParams.get('latitude')).toBe('28.0135648')
    expect(url.searchParams.get('longitude')).toBe('85.2525557')
    expect(url.searchParams.get('timezone')).toBe('Asia/Kathmandu')
  })

  it('turns the parallel daily arrays into one entry per day', () => {
    const forecast = parseForecast(sample)!
    expect(forecast.current).toMatchObject({ temperature: 11.7, isDay: false, code: 0 })
    expect(forecast.days).toHaveLength(2)
    expect(forecast.days[1]).toEqual({
      date: '2026-10-18', code: 45, max: 18.9, min: 10, rainChance: null, sunrise: '2026-10-18T06:06', sunset: '2026-10-18T17:32',
    })
  })

  it('rejects an unexpected shape instead of rendering garbage', () => {
    expect(parseForecast({ current: {} })).toBeNull()
    expect(parseForecast(null)).toBeNull()
  })

  it('returns null when the service fails, so the page still renders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await getForecast()).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 503 })))
    expect(await getForecast()).toBeNull()
  })

  it('caches the response for half an hour', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(sample))
    vi.stubGlobal('fetch', fetchMock)
    expect((await getForecast())?.elevation).toBe(1746)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 1800 } })
  })
})

describe('conditions', () => {
  it.each([
    [0, 'clear'], [1, 'partly'], [2, 'partly'], [3, 'cloudy'], [45, 'fog'], [53, 'drizzle'],
    [63, 'rain'], [81, 'showers'], [73, 'snow'], [95, 'thunder'], [99, 'thunder'],
  ])('code %i is %s', (code, condition) => {
    expect(conditionFor(code)).toBe(condition)
  })
})
