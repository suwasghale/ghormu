import { describe, expect, it } from "vitest"

import { formatDate, formatDay, formatDayRange, toBikramSambat } from "./dates"

const full = { day: "numeric", month: "long", year: "numeric" } as const

describe("Bikram Sambat", () => {
  it("lands each Nepali new year on 1 Baisakh", () => {
    expect(toBikramSambat("2023-04-14")).toEqual({ year: 2080, month: 0, day: 1 })
    expect(toBikramSambat("2024-04-13")).toEqual({ year: 2081, month: 0, day: 1 })
    expect(toBikramSambat("2025-04-14")).toEqual({ year: 2082, month: 0, day: 1 })
  })

  it("ends the year on the last day of Chaitra", () => {
    expect(toBikramSambat("2024-04-12")).toEqual({ year: 2080, month: 11, day: 30 })
  })
})

describe("formatDay", () => {
  it("writes Nepali pages in Bikram Sambat, without a comma in the year", () => {
    expect(formatDay("ne", "2025-04-14", full)).toBe("१ वैशाख २०८२")
  })

  it("keeps English pages Gregorian", () => {
    expect(formatDay("en", "2025-04-14", full)).toBe("14 April 2025")
  })

  it("gives a single part when only one is asked for", () => {
    expect(formatDay("ne", "2025-04-14", { month: "short" })).toBe("वैशाख")
    expect(formatDay("ne", "2025-04-14", { day: "numeric" })).toBe("१")
  })
})

describe("formatDayRange", () => {
  it("shares the month and year within one month", () => {
    expect(formatDayRange("ne", "2025-04-14", "2025-04-16", full)).toBe("१–३ वैशाख २०८२")
  })

  it("names both months across a month boundary", () => {
    expect(formatDayRange("ne", "2025-05-14", "2025-05-16", full)).toBe("३१ वैशाख – २ जेठ २०८२")
  })

  it("names both years across the new year", () => {
    expect(formatDayRange("ne", "2025-04-12", "2025-04-15", full)).toBe("३० चैत २०८१ – २ वैशाख २०८२")
  })
})

describe("formatDate", () => {
  it("uses the calendar day in Nepal, not in UTC", () => {
    // 20:00 UTC on 13 April 2025 is already 14 April (1 Baisakh) in Kathmandu.
    expect(formatDate("ne", "2025-04-13T20:00:00Z")).toBe("१ वैशाख २०८२")
  })
})
