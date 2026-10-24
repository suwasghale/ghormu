/*
 * Ghormu's service worker: the public site on a weak or missing signal.
 *
 * - Public pages (/ne/…, /en/…) are fetched from the network first. With a
 *   saved copy, the network gets WEAK_SIGNAL_MS; after that the saved copy
 *   is shown and the fetch carries on to refresh it. With no network at
 *   all, the saved copy or the offline page.
 * - Build files, fonts, icons and the site's photos never change under the
 *   same address, so they are served from the cache once saved.
 * - Resized photos (/_next/image) are shown from the cache and refreshed
 *   behind the scenes.
 * - Everything else passes straight through untouched: the admin, sign-in,
 *   the API, uploads, and Next's in-page navigation data (a failed one
 *   falls back to a full page load, which this worker can then answer).
 *
 * Registered by components/site/service-worker.tsx, in production only.
 * Change VERSION when the caching rules change, to drop the old caches.
 */

const VERSION = "v1"
const PAGES = `ghormu-pages-${VERSION}`
const ASSETS = `ghormu-assets-${VERSION}`
const IMAGES = `ghormu-images-${VERSION}`

const WEAK_SIGNAL_MS = 4000
const LIMITS = { [PAGES]: 40, [IMAGES]: 150 }
const OFFLINE_PAGES = { ne: "/ne/offline", en: "/en/offline" }

const PUBLIC_PAGE = /^\/(ne|en)(\/|$)/
const IMMUTABLE = /^\/(_next\/static|icons|images)\//

self.addEventListener("install", (event) => {
  event.waitUntil(saveOfflinePages().then(() => self.skipWaiting()))
})

/**
 * The offline pages, and the build files they load, so their "try again"
 * button and list of saved pages work with no network at all.
 */
async function saveOfflinePages() {
  const pages = await caches.open(PAGES)
  const assets = await caches.open(ASSETS)

  for (const path of Object.values(OFFLINE_PAGES)) {
    const response = await fetch(path, { cache: "no-store" })
    if (!response.ok) continue

    await pages.put(path, response.clone())
    const html = await response.text()
    const files = new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)"/g)].map((match) => match[1]))
    await Promise.all([...files].map((file) => assets.add(file).catch(() => {})))
  }
}

self.addEventListener("activate", (event) => {
  const current = new Set([PAGES, ASSETS, IMAGES])
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("ghormu-") && !current.has(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Next's in-page navigation data: left alone (see above).
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return

  if (request.mode === "navigate") {
    if (PUBLIC_PAGE.test(url.pathname)) event.respondWith(page(event))
    else if (url.pathname === "/") event.respondWith(root(event))
    return
  }

  if (IMMUTABLE.test(url.pathname)) event.respondWith(cacheFirst(request))
  else if (url.pathname === "/_next/image") event.respondWith(staleWhileRevalidate(event, IMAGES))
})

/** Network first; a saved copy after WEAK_SIGNAL_MS, or when offline. */
async function page(event) {
  const cache = await caches.open(PAGES)
  const network = fetch(event.request).then((response) => {
    if (savable(response)) {
      event.waitUntil(cache.put(event.request, response.clone()).then(() => trim(PAGES)))
    }
    return response
  })
  // Keep the worker alive while a slow fetch finishes refreshing the copy.
  event.waitUntil(network.catch(() => {}))

  const saved = await cache.match(event.request, { ignoreSearch: true })

  if (saved) {
    return Promise.race([network.catch(() => saved), delay(WEAK_SIGNAL_MS).then(() => saved)])
  }

  try {
    return await network
  } catch {
    const locale = new URL(event.request.url).pathname.startsWith("/en") ? "en" : "ne"
    return (await cache.match(OFFLINE_PAGES[locale])) ?? Response.error()
  }
}

/** `/` redirects by language; offline, open the saved Nepali home instead. */
async function root(event) {
  try {
    return await fetch(event.request)
  } catch {
    const cache = await caches.open(PAGES)
    return (await cache.match("/ne")) ?? (await cache.match("/en")) ?? (await cache.match(OFFLINE_PAGES.ne)) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS)
  const saved = await cache.match(request)
  if (saved) return saved

  const response = await fetch(request)
  if (savable(response)) await cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(event, name) {
  const cache = await caches.open(name)
  const saved = await cache.match(event.request)
  const network = fetch(event.request).then((response) => {
    if (savable(response)) {
      event.waitUntil(cache.put(event.request, response.clone()).then(() => trim(name)))
    }
    return response
  })

  if (saved) {
    event.waitUntil(network.catch(() => {}))
    return saved
  }
  return network
}

function savable(response) {
  return response.ok && response.type === "basic"
}

/** Oldest first: keep each growing cache to its limit. */
async function trim(name) {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  const extra = keys.length - LIMITS[name]
  for (const key of keys.slice(0, Math.max(0, extra))) await cache.delete(key)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
