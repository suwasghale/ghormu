# Ghormu

The website of Ghormu, a hill village in Nepal: [ghormu.com](https://ghormu.com). It tells the village's story in its own words, in Nepali first and English, and keeps its news, photographs and records in one place for the people who live there and for those who have moved far away.

## What the site does

- **Public site in two languages.** Every page lives at `/ne/…` and `/en/…`. Bare `/` sends a visitor to the language they last chose, or to Nepali. Dates on Nepali pages are in Bikram Sambat.
- **About, Explore, Community, Updates and Contact.** The village's story, culture, history and digital archive; tourism, a travel guide with live weather, a photo gallery and a 3D map; the clans and an events calendar; news, notices and development projects; contact, feedback and emergency numbers.
- **Support page** for people who want to help, with the village's projects, their budgets and progress.
- **An admin at `/admin`** where staff publish news, events, projects, archive items and map places, and read the messages sent through the forms. A publish rebuilds the affected pages at once.
- **Built for the hills.** Pages a visitor has opened keep working on a weak or missing signal, and the site can be installed on a phone's home screen. Every page meets WCAG 2.1 AA, checked by a test.
- **Community portal (in progress).** Family records, events and contributions for each community, starting with the Ghale community. Sign-in, accounts and two-factor security are already in place.

Photographs are used with their owners' permission and credited wherever they appear.

## Start here

Install Docker Desktop with Linux containers and Python 3.14, then run from this directory:

```sh
python scripts/tasks.py bootstrap
python scripts/tasks.py dev
```

The first build installs the locked dependencies. Subsequent starts reuse Docker layers and volumes.

| Service | Local address |
| --- | --- |
| Website (Nepali and English) | http://localhost:3010 |
| Site admin | http://localhost:3010/admin |
| Django admin | http://localhost:8010/django-admin/ |
| API documentation | http://localhost:8010/api/schema/swagger-ui/ |
| Readiness | http://localhost:8010/health/ready/ |
| Captured development email | http://localhost:8030 |
| PostgreSQL / Redis | localhost:5440 / localhost:6390 |

Create your administrator interactively:

```sh
python scripts/tasks.py superuser
```

There is no shared or default administrator password. Bootstrap keeps existing configuration and creates fresh secrets for new copies.

Optional settings, all in the environment files that bootstrap writes:

- `GOOGLE_MAPS_API_KEY` (frontend): shows Google's 3D view on the map page. Without it the map uses free open data.
- `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` (backend): "Continue with Google" on sign-in.
- `ADMIN_EMAIL` (backend): where contact and support messages are emailed.

## Built with

- **Frontend:** Next.js 16, React 19, TypeScript and Tailwind. MapLibre and CesiumJS for the map, a service worker for offline use, Playwright and axe for browser and accessibility tests.
- **Backend:** Django 6 and Django REST Framework on PostgreSQL, Celery and Redis for background work, an OpenAPI contract in `contracts/openapi`.
- **Accounts:** email registration and verification, password reset, sessions, two-factor sign-in with recovery codes, account deletion and optional Google sign-in. Tokens stay in HttpOnly cookies.
- **Running it:** Docker stacks for development and production, Nginx with TLS, health checks, backups and CI.

## Common commands

```sh
python scripts/tasks.py test
python scripts/tasks.py lint
python scripts/tasks.py migrate
python scripts/tasks.py schema
python scripts/tasks.py logs
python scripts/tasks.py backup
python scripts/tasks.py down
python scripts/tasks.py validate-production
```

`down` preserves database and media volumes. Equivalent `make` targets are included. Production backup uses `python scripts/tasks.py backup --production`.

When you add or replace a photograph in `frontend/public/images/ghormu`, run `node scripts/photo-assets.mjs` from `frontend/` to make its loading placeholder and share card.

Production validation needs the frontend dependencies and Playwright Chromium (`pnpm exec playwright install chromium` in `frontend`). Follow [deployment setup](docs/DEPLOYMENT.md) for the server, TLS, GitHub release settings and backups.

## Structure

```text
backend/apps/public_content/  News, events, projects, archive and map places
backend/apps/contact/         Messages from the contact and feedback forms
backend/apps/users/           Accounts, sign-in and account security
backend/apps/profiles/        Profiles and addresses
backend/core/                 API primitives, languages, security and storage
backend/config/               Settings and routes
frontend/app/[locale]/        The public site, in Nepali and English
frontend/app/(app)/           Sign-in, profile and the site admin
frontend/content/             Page copy in both languages, and the photo list
frontend/components/site/     The public site's components
frontend/lib/                 API clients, languages, dates and helpers
frontend/public/              Photographs, share cards, icons, service worker
infra/                        Docker, Nginx and backups
scripts/                      Bootstrap and the task runner
contracts/openapi/            Generated API contract
docs/                         Architecture, deployment, testing and operations
```

Read [architecture](docs/ARCHITECTURE.md) for how the pieces fit, and [deployment](docs/DEPLOYMENT.md), [testing](docs/TESTING.md) and [operations](docs/OPERATIONS.md) for running it. The [contribution guide](CONTRIBUTING.md) and [security policy](SECURITY.md) apply to anyone working on the code.

The project began from a reusable Next.js and Django starter; [source provenance](docs/PROVENANCE.md) records where its modules came from.
