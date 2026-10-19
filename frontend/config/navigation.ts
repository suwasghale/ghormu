/**
 * Information architecture of the public site.
 *
 * Six top-level items, each grouping related pages; utility pages live in
 * the footer only. Paths are locale-less (`/about/history`) and become
 * `/ne/about/history` or `/en/about/history` when rendered. Labels come from
 * the dictionaries by `key`, so a page added here without a translation in
 * both languages does not compile.
 */

import type { Dictionary } from "@/lib/i18n"

export type NavKey = keyof Dictionary["nav"]

export type NavLink = {
  key: NavKey
  href: string
  /** False for app routes that live outside the locale prefix, e.g. sign-in. */
  localized?: false
}

export type NavItem = NavLink & { children?: NavLink[] }

export const mainNav: NavItem[] = [
  { key: "home", href: "/" },
  {
    key: "about",
    href: "/about",
    children: [
      { key: "aboutGhormu", href: "/about" },
      { key: "history", href: "/about/history" },
      { key: "vision", href: "/about/vision" },
      { key: "culture", href: "/about/culture" },
      { key: "archive", href: "/about/archive" },
    ],
  },
  {
    key: "explore",
    href: "/explore",
    children: [
      { key: "tourism", href: "/explore" },
      { key: "attractions", href: "/explore/attractions" },
      { key: "gallery", href: "/explore/gallery" },
      { key: "experiences", href: "/explore/experiences" },
      { key: "travelGuide", href: "/explore/travel-guide" },
    ],
  },
  {
    key: "community",
    href: "/community",
    children: [
      { key: "communityOverview", href: "/community" },
      { key: "surnames", href: "/community/surnames" },
      { key: "events", href: "/community/events" },
      { key: "portal", href: "/login", localized: false },
    ],
  },
  {
    key: "updates",
    href: "/updates",
    children: [
      { key: "news", href: "/updates" },
      { key: "announcements", href: "/updates/announcements" },
      { key: "development", href: "/updates/development" },
    ],
  },
  {
    key: "contact",
    href: "/contact",
    children: [
      { key: "contactUs", href: "/contact" },
      { key: "feedback", href: "/contact/feedback" },
      { key: "emergency", href: "/contact/emergency" },
    ],
  },
]

export type FooterColumn = {
  key: "discover" | "community" | "help"
  links: NavLink[]
}

export const footerColumns: FooterColumn[] = [
  {
    key: "discover",
    links: [
      { key: "aboutGhormu", href: "/about" },
      { key: "history", href: "/about/history" },
      { key: "culture", href: "/about/culture" },
      { key: "tourism", href: "/explore" },
      { key: "gallery", href: "/explore/gallery" },
    ],
  },
  {
    key: "community",
    links: [
      { key: "communityOverview", href: "/community" },
      { key: "events", href: "/community/events" },
      { key: "news", href: "/updates" },
      { key: "portal", href: "/login", localized: false },
      { key: "support", href: "/support" },
    ],
  },
  {
    key: "help",
    links: [
      { key: "contactUs", href: "/contact" },
      { key: "emergency", href: "/contact/emergency" },
      { key: "faq", href: "/faq" },
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
      { key: "accessibility", href: "/accessibility" },
      { key: "sitemap", href: "/sitemap" },
    ],
  },
]

/**
 * Public pages that have their own route and real content. Add a page here
 * when you build it: it leaves the placeholder list and joins the sitemap.
 */
export const publishedPages = [
  "/",
  "/about",
  "/about/history",
  "/about/vision",
  "/about/culture",
  "/about/archive",
  "/explore",
  "/explore/attractions",
  "/explore/gallery",
  "/explore/experiences",
  "/explore/travel-guide",
  "/community",
  "/community/surnames",
  "/community/events",
  "/updates",
  "/updates/announcements",
  "/updates/development",
  "/contact",
  "/contact/feedback",
  "/contact/emergency",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
  "/sitemap",
  "/support",
] as const

/**
 * Every localized page the navigation points at, other than home, with the
 * label that titles it.
 */
export const linkedPages: ReadonlyMap<string, NavKey> = new Map(
  [...mainNav.flatMap((item) => item.children ?? [item]), ...footerColumns.flatMap((column) => column.links)]
    .filter((link) => link.localized !== false && link.href !== "/")
    .map((link) => [link.href, link.key]),
)

/**
 * Linked pages not built yet. Each renders a "coming soon" placeholder, so no
 * link in the header or footer is ever a 404.
 */
export const placeholderPages: ReadonlyMap<string, NavKey> = new Map(
  [...linkedPages].filter(([path]) => !(publishedPages as readonly string[]).includes(path)),
)
