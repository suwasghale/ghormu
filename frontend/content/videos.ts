import type { StaticImageData } from "next/image"

import type { Locale } from "@/lib/i18n/config"

import t4ljT6KgSh08 from "@/assets/videos/4ljT6KgSh08.jpg"
import aqhAumLg3sc from "@/assets/videos/aqhAumLg3sc.jpg"
import dbqCNBnp3eY from "@/assets/videos/dbqCNBnp3eY.jpg"
import DcSiMZ_6iuo from "@/assets/videos/DcSiMZ_6iuo.jpg"
import dOqHJfPorpo from "@/assets/videos/dOqHJfPorpo.jpg"
import HfZLfVYj9Ds from "@/assets/videos/HfZLfVYj9Ds.jpg"
import OsWd7rpJ_ik from "@/assets/videos/OsWd7rpJ-ik.jpg"
import RJaDjdguFuo from "@/assets/videos/RJaDjdguFuo.jpg"
import U6JZB13frx0 from "@/assets/videos/U6JZB13frx0.jpg"
import XFF99gTABH0 from "@/assets/videos/XFF99gTABH0.jpg"
import Y6E_WJQ4DOE from "@/assets/videos/Y6E_WJQ4DOE.jpg"

/**
 * Ghormu's songs and dances, as filmed and published on YouTube by the
 * channels below. They play from YouTube (privacy-enhanced mode) and only
 * once a visitor presses play; every video shows its channel.
 *
 * Names are the song names the uploaders gave, not their full video titles,
 * which name the district. To add one: run
 * `node scripts/video-thumbnails.mjs VIDEO_ID`, then add it here.
 */

export const videoChannels = {
  jambuling: { name: "Jambuling Films", url: "https://www.youtube.com/@jambulingfilms" },
  chyangba: { name: "Chyangba Dai", url: "https://www.youtube.com/@Chyangbadai" },
  roman: { name: "Roman Thokra", url: "https://www.youtube.com/@romanthokra143" },
  lmc: { name: "LMC Digital Media", url: "https://www.youtube.com/@lhapsangkarpo" },
} as const

type Kind = "syabru" | "tamangDance" | "dance" | "song"

/** What each video is, as its uploader described it. */
export const videoKinds: Record<Kind, Record<Locale, string>> = {
  syabru: { ne: "स्याब्रु नाच", en: "Syabru dance" },
  tamangDance: { ne: "तामाङ नाच", en: "Tamang dance" },
  dance: { ne: "सांस्कृतिक नाच", en: "Cultural dance" },
  song: { ne: "सांस्कृतिक गीत", en: "Cultural song" },
}

/** The groups a visitor can pick between, in the order shown. */
export const videoCategories = ["syabru", "dances", "songs"] as const
export type VideoCategory = (typeof videoCategories)[number]

const CATEGORY_OF: Record<Kind, VideoCategory> = {
  syabru: "syabru",
  tamangDance: "dances",
  dance: "dances",
  song: "songs",
}

export function videoCategory(video: Video): VideoCategory {
  return CATEGORY_OF[video.kind]
}

/** Words the player uses, shared by every page that shows it. */
export const videoText = {
  ne: {
    all: "सबै",
    categories: { syabru: "स्याब्रु नाच", dances: "अरू नाच", songs: "गीत" },
    categoriesLabel: "भिडियोको प्रकार",
    play: "बजाउनुहोस्",
    playing: "बजिरहेको",
    list: "भिडियोहरू",
    by: "भिडियो",
    watchOnYouTube: "YouTube मा हेर्नुहोस्",
    note: "भिडियो YouTube बाट बज्छन्, र प्ले थिच्दा मात्र खुल्छन्। प्रत्येक भिडियो त्यसलाई खिच्ने र प्रकाशन गर्नेको हो।",
  },
  en: {
    all: "All",
    categories: { syabru: "Syabru dances", dances: "Other dances", songs: "Songs" },
    categoriesLabel: "Kind of video",
    play: "Play",
    playing: "Now playing",
    list: "Videos",
    by: "Video",
    watchOnYouTube: "Watch on YouTube",
    note: "Videos play from YouTube, and only load when you press play. Each belongs to the channel that filmed and published it.",
  },
} satisfies Record<Locale, unknown>

export type VideoText = (typeof videoText)[Locale]

export type Video = {
  id: string
  /** The song's name, as the uploader wrote it. */
  name: Record<Locale, string>
  kind: Kind
  channel: keyof typeof videoChannels
  thumbnail: StaticImageData
  /** Seconds in, where the song starts. */
  start?: number
}

function video(id: string, thumbnail: StaticImageData, kind: Kind, channel: Video["channel"], name: string, nameNe = name, start?: number): Video {
  return { id, thumbnail, kind, channel, name: { ne: nameNe, en: name }, start }
}

export const videos: Video[] = [
  // Syabru dances
  video("Y6E_WJQ4DOE", Y6E_WJQ4DOE, "syabru", "jambuling", "Sochi Yala So"),
  video("aqhAumLg3sc", aqhAumLg3sc, "syabru", "jambuling", "Sochi Karpe"),
  video("RJaDjdguFuo", RJaDjdguFuo, "syabru", "jambuling", "Niraang Yusunda"),
  video("U6JZB13frx0", U6JZB13frx0, "syabru", "jambuling", "Kangde Tempe Chila Chhyapa Ye", undefined, 451),
  video("HfZLfVYj9Ds", HfZLfVYj9Ds, "syabru", "jambuling", "Menchyung Bome", undefined, 130),
  // Other dances
  video("dOqHJfPorpo", dOqHJfPorpo, "dance", "jambuling", "Damu Kesha"),
  video("4ljT6KgSh08", t4ljT6KgSh08, "tamangDance", "jambuling", "Syaar Dinchen Nema"),
  video("dbqCNBnp3eY", dbqCNBnp3eY, "tamangDance", "chyangba", "A new Tamang dance", "नयाँ तामाङ नाच"),
  // Songs
  video("OsWd7rpJ-ik", OsWd7rpJ_ik, "song", "jambuling", "Sochi Yala So Ya"),
  video("DcSiMZ_6iuo", DcSiMZ_6iuo, "song", "roman", "Singing together", "सँगै गाउँदा", 98),
  video("XFF99gTABH0", XFF99gTABH0, "song", "lmc", "Tamang song", "तामाङ गीत"),
]

export function youtubeUrl(video: Video): string {
  return `https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}s` : ""}`
}

/** Privacy-enhanced player: YouTube sets no cookies until the video plays. */
export function embedUrl(video: Video): string {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" })
  if (video.start) params.set("start", String(video.start))
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`
}
