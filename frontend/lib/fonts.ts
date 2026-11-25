import { Mukta } from "next/font/google"

/**
 * The public site's typeface, shared by app/[locale]/layout.tsx and
 * app/global-not-found.tsx (a document of its own, outside that layout).
 *
 * One family for everything. Mukta was drawn for Devanagari and Latin
 * together, so Nepali and English sit at the same size and weight, and it is
 * the face many Nepali news sites use, so it reads as familiar rather than
 * styled. Four weights: regular for reading, 500 for labels, 600 for
 * headings and 700 for the largest titles. Every file is preloaded, so each
 * extra weight competes with the first photo on a slow connection.
 */
export const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
})

/** Class names that define --font-mukta on <html>. */
export const fontVariables = mukta.variable
