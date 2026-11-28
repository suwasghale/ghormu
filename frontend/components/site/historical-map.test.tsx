// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import archive from "@/content/archive"
import mapContent from "@/content/map"
import { historicalFrames } from "@/lib/historical-imagery"

import { HistoricalMap } from "./historical-map"

const strings = archive.en.throughTime
const frames = historicalFrames("en", [
  { captured: "2009-01-27", source: "GeoEye", resolution: 1, release: 27946, maxZoom: 17 },
  { captured: "2017-12-08", source: "Vantor", resolution: 0.46, release: 32246, maxZoom: 18 },
  { captured: "2025-02-21", source: "Vantor", resolution: 0.34, release: 3692, maxZoom: 18 },
])

function renderMap() {
  return render(
    <HistoricalMap frames={frames} places={[]} mapStrings={mapContent.en} strings={strings} viewStrings={archive.en.historyMap.views} />,
  )
}

// jsdom has no WebGL, so the map itself says it cannot open: what a phone
// without WebGL shows. The timeline and its credits still work.
describe("the historical map", () => {
  it("says plainly when the device cannot draw the map, and offers no 3D switch", async () => {
    renderMap()
    expect(await screen.findByText(mapContent.en.unsupported)).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: archive.en.historyMap.views.label })).not.toBeInTheDocument()
  })

  it("opens on the newest photograph, credited", () => {
    renderMap()
    const years = within(screen.getByRole("group", { name: strings.years }))

    expect(years.getAllByRole("button").map((button) => button.textContent)).toEqual(["2009", "2017", "2025"])
    expect(years.getByRole("button", { name: "2025" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/Taken: 21 February 2025 · Vantor/)).toBeInTheDocument()
  })

  it("moves to another date from the timeline", async () => {
    renderMap()
    await userEvent.click(screen.getByRole("button", { name: strings.previous }))

    expect(within(screen.getByRole("group", { name: strings.years })).getByRole("button", { name: "2017" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/Taken: 8 December 2017/)).toBeInTheDocument()
  })
})
