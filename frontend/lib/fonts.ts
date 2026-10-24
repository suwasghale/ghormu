import { Mukta, Noto_Serif_Devanagari } from "next/font/google"

/**
 * The public site's two typefaces, shared by app/[locale]/layout.tsx and
 * app/global-not-found.tsx (a document of its own, outside that layout).
 */

/**
 * Body text. Three weights: every file here is preloaded on every page, so
 * each one competes with the hero photo on a slow connection. Bold (700)
 * text falls back to 600 without faux-bolding; headings use the serif.
 */
export const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mukta",
  display: "swap",
})

/** Headings only; one variable file covers every weight. */
export const notoSerif = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: "variable",
  variable: "--font-noto-serif",
  display: "swap",
})

/** Class names that define --font-mukta and --font-noto-serif on <html>. */
export const fontVariables = `${mukta.variable} ${notoSerif.variable}`
