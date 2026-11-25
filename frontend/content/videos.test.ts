import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import culture from "./culture"
import home from "./home"
import { embedUrl, videoCategories, videoCategory, videoChannels, videos, videoText, youtubeUrl } from "./videos"

describe("songs and dances", () => {
  it("never names the district, in any language", () => {
    const text = JSON.stringify([videos.map((video) => video.name), videoText, home.ne.songs, home.en.songs, culture.ne.songsLead, culture.en.songsLead])
    expect(text).not.toMatch(/rasuwa|रसुवा/i)
  })

  it("lists each video once, with its thumbnail and channel", () => {
    expect(new Set(videos.map((video) => video.id)).size).toBe(videos.length)
    for (const video of videos) {
      expect(existsSync(join(__dirname, "..", "assets", "videos", `${video.id}.jpg`))).toBe(true)
      expect(videoChannels[video.channel].url).toMatch(/^https:\/\/www\.youtube\.com\/@/)
    }
  })

  it("puts every video in a group, groups kept together in the list", () => {
    const order = videos.map(videoCategory)
    expect(order).toEqual([...order].sort((a, b) => videoCategories.indexOf(a) - videoCategories.indexOf(b)))
    for (const category of videoCategories) expect(order).toContain(category)
  })

  it("plays from the privacy-enhanced player, starting where the song starts", () => {
    const later = videos.find((video) => video.id === "U6JZB13frx0")!
    expect(embedUrl(later)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/U6JZB13frx0\?.*start=451/)
    expect(youtubeUrl(later)).toBe("https://www.youtube.com/watch?v=U6JZB13frx0&t=451s")
  })
})
