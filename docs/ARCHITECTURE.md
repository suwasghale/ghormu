# Architecture and extension points

## Backend

Views validate with serializers, call services for writes and selectors for reads. `users` owns identity; `profiles` owns editable account details and addresses. Their original migrations were kept together because moving profile ownership involved migration dependencies. Do not replace the custom user model after your first migration.

`config/settings/components` owns shared settings. `dev`, `test`, `build` and `prod` apply explicit environment policies. Test settings use SQLite, local-memory cache, in-memory mail and eager Celery tasks; PostgreSQL is also exercised in CI. Production enforces secure cookies, HTTPS and host validation.

The API keeps its original `{success, message, data}` envelope and structured errors. List data contains `results` and `pagination`. `/api/v1/admin/users/` is staff-only, and privilege changes are checked server-side. Django admin is deliberately mounted at `/django-admin/`, leaving `/admin` for Next.js.

## Authentication

The browser calls `/api/auth/login`. Next exchanges credentials with Django, stores tokens in HttpOnly, SameSite=Lax cookies and returns only the user. `/api/proxy/...` attaches the access token server-side. Tokens never enter Zustand or browser storage. Authenticated reads are uncached. Mutations require the configured application Origin.

Refresh calls are coalesced within one frontend process. Backend session rotation and replay detection remain authoritative. This starter targets one frontend instance; before horizontally scaling Next.js, add shared refresh coordination and test simultaneous rotations across instances. `proxy.ts` only handles routing; server layouts ask Django to validate protected sessions and staff access.

Registration, verification, reset and email-change confirmation use the public BFF allowlist. Social login is available in the backend but is deliberately excluded from the generic proxy because its response contains tokens; add a dedicated provider callback using the existing BFF cookie pattern when enabling it.

## Frontend

Edit `frontend/config/site.ts` and environment values for identity. The Tailwind theme in `app/globals.css` and copied UI components provide the visual foundation. Existing admin labels retain parts of the donors' French editorial UI; account flows are English.

## Languages

The public site is Nepali first, with English as the second language. Routes are prefixed: `/ne/...` and `/en/...`. `proxy.ts` redirects a bare `/` to the visitor's last choice (the `locale` cookie set by the language switcher), or to Nepali for everyone else. The public site has its own root layout in `app/[locale]/layout.tsx`, so `<html lang>` always matches the page's language. The account and admin screens keep theirs in `app/(app)/layout.tsx` and are English for now. `app/global-not-found.tsx` serves a bilingual 404 for URLs that match neither.

- Strings live in `frontend/lib/i18n/dictionaries`. `ne.ts` is the source, and `en.ts` must have the same keys or the build fails. Server components call `getDictionary(locale)` and pass client components only the strings they render.
- The navbar (six items) and footer columns are data in `frontend/config/navigation.ts`. Every linked page without its own route renders a `noindex` "coming soon" placeholder from `app/[locale]/[...slug]`. To build a page, add `app/[locale]/<path>/page.tsx` using `pageLocale`, `pageMetadata` and `crumbs` from `lib/i18n/page.ts`, then add its path to `publishedPages`. That removes its placeholder and adds it to the sitemap.
- Long-form page copy lives in `frontend/content/<page>.ts` as `bilingual({ ne, en })`. The English object must match the Nepali shape exactly. These files are what the Django CMS will replace later. Shared building blocks (`Section`, `PageHero`, `Landscape`, `TopoPattern`, `Faq`, `JsonLd`) are in `frontend/components/site`.
- On the backend, translatable content uses paired columns (`title_ne`, `title_en`). `core.i18n` resolves the language from `?lang=`, then `Accept-Language`, then falls back to Nepali, and it falls back to the other column when one is empty. Profiles store `preferred_language` as `ne` or `en`, with `ne` as the default.

## Public content

Content that changes over time is managed in the admin at `/admin`, not written into the code:

- **`apps.public_content`** holds five kinds of content: news and announcements (`Post`), events (`Event`), development projects (`Project`), the digital archive (`ArchiveItem`) and places on the village map (`MapPlace`). Each has paired Nepali/English columns and the draft → published → archived lifecycle. Archive items with kind `satellite` (dated aerial views with their required credit line) power the "Ghormu through time" comparison. An archive item cannot be published until `consent_confirmed` is ticked, and drafts and unconsented items never leave the public API.
- **`apps.contact`** stores contact and feedback messages. It is separate because it holds personal data, and it has no public read endpoint. `POST /api/v1/contact/` is rate-limited (the `submission` throttle) and has a honeypot field. Each message is emailed to `ADMIN_EMAIL` with a link to it in the admin.
- **Public reads** come from `/api/v1/content/...` (`posts`, `events`, `projects`, `archive`, `places`) and are fetched on the server by `frontend/lib/api/content.ts`, tagged and cached for five minutes. If the API is down, lists come back empty with `ok: false` and pages say so instead of failing.
- **Rebuilds on publish.** Every admin write queues `core.tasks.revalidate_frontend_paths`, which posts to the frontend's `/api/revalidate` with `FRONTEND_REVALIDATE_SECRET`. The frontend checks it against `REVALIDATE_SECRET` and rebuilds the tagged pages in both languages. `python scripts/tasks.py bootstrap` writes the same random secret to both env files.
- **Story and archive item pages** (`/updates/<slug>`, `/about/archive/<slug>`) are not built ahead of time. They render on first visit and stay cached until edited. That is why `app/[locale]/layout.tsx` must not set `dynamicParams = false`: it would turn every newly published address into a 404.
- **Fixed facts** that rarely change stay in `frontend/content/` files rather than the database: emergency numbers, road status (`road-status.ts`), the travel route, attractions and local hosts. Empty lists are hidden or replaced by an honest "being prepared" note.

## Village map

`/explore/map` is a 3D map of Ghormu with a list of places beside it (`components/site/village-map.tsx`). It has two engines:

- **Google 3D** (`map-google.tsx`) is used when `GOOGLE_MAPS_API_KEY` is set. It shows Google's Photorealistic 3D Tiles, the Google Earth view, through CesiumJS, opening on the camera from the village's Google Earth link (`googleStartView` in `frontend/config/map.ts`). Google bills one request per page view; 1,000 a month are free. Its terms require the Google logo and data credits on the map (Cesium shows both), forbid caching the tiles, and allow no geocoder but Google's, so the map has no search. Create the key in Google Cloud with billing and the Map Tiles API, restrict it to that API and to the site's addresses, and set a daily quota.
- **The free map** (`map-basic.tsx`, MapLibre) is used when there is no key, when the browser lacks WebGL for Cesium, or when Google refuses the request (quota, billing, bad key). It drapes Sentinel-2 cloudless 2024 imagery by EOX (10 m per pixel, CC BY-NC-SA 4.0, so non-commercial use only) on AWS Terrain Tiles (mostly SRTM, about 30 m between height samples). The page prints the credits of whichever engine is showing, and its accuracy notes follow it.
- **Places** are `MapPlace` rows managed under Map places in the admin. Coordinates are decimal degrees as Google Maps copies them. A point more than about 5 km from the village is refused, which catches swapped latitude and longitude. Public places only, never private homes. Migration `0003_first_map_place` adds Ghormu Primary School. Altitudes shown for a place come from the open elevation tiles in both engines (`lib/map/elevation.ts`), so they are heights above sea level.
- **The page renders per request** (`connection()`), so the key is read from the running server's environment and never baked into a build. The places list is still cached and refreshed by the admin.
- **Browser files** for both libraries (the MapLibre worker, and Cesium's script, workers, WebAssembly decoders and assets) are copied from `node_modules` into `public/vendor/` by `scripts/copy-map-assets.mjs`, which `pnpm dev` and `pnpm build` run first. The copies are not committed. The script also replaces Knockout's `(0,eval)("this")` in Cesium's bundle with `globalThis`, so Cesium loads under the Content-Security-Policy without `unsafe-eval`. The policy allows `wasm-unsafe-eval` for the Draco mesh decoder, plus the tile hosts in `mapTileOrigins`.

## Photographs

The site's own photos of Ghormu are in `frontend/public/images/ghormu` and are listed in `frontend/content/photos.ts`. Each entry records the photo's size, a description in both languages, and its source. They are used with their owners' permission (Plein Leurs Yeux and Little World Nepal France), and every use shows a credit through `PhotoImage` / `PhotoCredit`. They are served through `next/image`, so visitors get resized AVIF/WebP files.

To add one, first get the owner's permission. Then re-encode it to WebP with its EXIF and GPS data removed (long edge at most 1600px), add it to `photos.ts` with its source, and use it. Photos people send for the archive go through the admin instead (`ArchiveItem`), where permission must be confirmed before publishing.

`lib/admin/resources.ts` declares fields, columns and filters for the generic admin table/form. Add a matching backend resource endpoint and a resource definition to reuse those screens. Avoid adding a navigation entry until its route and permissions work.

To add a feature:

1. Add a Django app with models, serializers, selectors/services, routes and permission tests.
2. Register it in settings and mount public/admin routes separately.
3. Generate migrations and the API schema.
4. Add its typed API functions and resource definition or feature-specific pages.
5. Test authorization and failed writes, not just successful rendering.

## Email, tasks and storage

Account emails are rendered from `backend/templates/emails` and sent by the copied Celery tasks. Development Compose routes SMTP to Mailpit; production uses the provider configured in the backend environment. Exactly one Beat service schedules session/token cleanup.

`core/storage/images.py` validates and re-encodes uploads. `USE_CLOUD_STORAGE=False` uses local storage; R2 is configured through the documented `R2_*` variables. The storage adapter is based on Django's storage API. Use separate private credentials/bucket for database backups. Set `MEDIA_HOST` on the frontend when allowing an external image hostname.

Optional Sentry initializes only when `SENTRY_DSN` is present. It disables default PII and scrubs sensitive request and exception fields. Do not enable it with test credentials or user data you are not authorized to send.
