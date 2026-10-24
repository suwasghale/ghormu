import type { MetadataRoute } from "next"

/**
 * Lets visitors add Ghormu to their phone's home screen and open it like an
 * app: its own icon, its own window, no browser bars. Icons are drawn by
 * scripts/app-icons.mjs. Nepali first, as on the site; `/` then sends each
 * visitor to the language they last chose.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "घोर्मु · Ghormu",
    short_name: "घोर्मु",
    description: "नेपालको एउटा पहाडी गाउँ, गाउँलेकै शब्दमा · A hill village in Nepal, in its own words",
    lang: "ne",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f9fcfe",
    theme_color: "#1d5c45",
    categories: ["travel", "news", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
