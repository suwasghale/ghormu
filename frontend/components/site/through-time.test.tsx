// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import archive from "@/content/archive"

import { ThroughTime, type TimeFrame } from "./through-time"

const strings = archive.en.throughTime

function frame(year: number, dateLabel = String(year)): TimeFrame {
  return {
    id: `f${year}`,
    year,
    yearLabel: String(year),
    dateLabel,
    title: `Ghormu from above, ${year}`,
    image: `/archive/${year}.jpg`,
    credit: `Google Earth · imagery ${year}`,
  }
}

// Out of order on purpose: the timeline sorts by year.
const frames = [frame(2016), frame(2004, "Nov 28, 2004"), frame(2026, "Jan 20, 2026")]

function years() {
  return within(screen.getByRole("group", { name: strings.years }))
}

function picture() {
  return screen.getAllByRole("img")[0] as HTMLImageElement
}

afterEach(() => vi.useRealTimers())

describe("Ghormu through time: year by year", () => {
  it("opens on the newest year, with its date and credit", () => {
    render(<ThroughTime frames={frames} strings={strings} />)

    expect(years().getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Jan 20, 2026")).toBeInTheDocument()
    expect(screen.getByText(/imagery 2026/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: strings.next })).toBeDisabled()
  })

  it("lists the years oldest first and jumps to one when clicked", async () => {
    render(<ThroughTime frames={frames} strings={strings} />)

    expect(years().getAllByRole("button").map((button) => button.textContent)).toEqual(["2004", "2016", "2026"])

    await userEvent.click(years().getByRole("button", { name: "2004" }))
    expect(years().getByRole("button", { name: "2004" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Nov 28, 2004")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: strings.previous })).toBeDisabled()
  })

  it("keeps the last picture up until the chosen year's picture has loaded", async () => {
    render(<ThroughTime frames={frames} strings={strings} />)
    expect(picture().getAttribute("src")).toBe("/archive/2026.jpg")

    await userEvent.click(years().getByRole("button", { name: "2016" }))
    expect(picture().getAttribute("src")).toBe("/archive/2026.jpg")

    const incoming = screen.getAllByRole("presentation").find((image) => image.getAttribute("src") === "/archive/2016.jpg")!
    fireEvent.load(incoming)
    expect(picture().getAttribute("src")).toBe("/archive/2016.jpg")
  })

  it("moves with the arrow keys along the years", async () => {
    render(<ThroughTime frames={frames} strings={strings} />)

    years().getByRole("button", { name: "2026" }).focus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(years().getByRole("button", { name: "2016" })).toHaveFocus()
    expect(years().getByRole("button", { name: "2016" })).toHaveAttribute("aria-pressed", "true")

    await userEvent.keyboard("{Home}")
    expect(years().getByRole("button", { name: "2004" })).toHaveAttribute("aria-pressed", "true")
  })

  it("plays from the oldest year to the newest, then stops", () => {
    vi.useFakeTimers()
    render(<ThroughTime frames={frames} strings={strings} />)

    // At the newest year, play starts again from the oldest.
    fireEvent.click(screen.getByRole("button", { name: strings.play }))
    expect(years().getByRole("button", { name: "2004" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: strings.pause })).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1600))
    expect(years().getByRole("button", { name: "2016" })).toHaveAttribute("aria-pressed", "true")

    act(() => vi.advanceTimersByTime(1600))
    expect(years().getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: strings.play })).toBeInTheDocument()
  })
})

describe("Ghormu through time: compare two years", () => {
  it("switches to the before-and-after slider, oldest against newest", async () => {
    render(<ThroughTime frames={frames} strings={strings} />)

    await userEvent.click(screen.getByRole("button", { name: strings.compareMode }))

    expect(screen.getByRole("slider", { name: strings.compare })).toBeInTheDocument()
    expect(screen.getByAltText("Ghormu from above, 2004")).toBeInTheDocument()
    expect(screen.getByAltText("Ghormu from above, 2026")).toBeInTheDocument()
  })
})

it("shows nothing with fewer than two years", () => {
  const { container } = render(<ThroughTime frames={[frame(2026)]} strings={strings} />)
  expect(container).toBeEmptyDOMElement()
})
