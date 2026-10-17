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
