# Ghormu

A reusable Next.js + Django foundation assembled by copying modules from **lwnf-dev** and **aucoeurdunepal**, then adapting their integration points. Client data, credentials, photographs, donation/sponsorship features and trekking operations are excluded.

## Start here

Install Docker Desktop with Linux containers and Python 3.14, then run from this directory:

```sh
python scripts/tasks.py bootstrap
python scripts/tasks.py dev
```

The first build installs the locked dependencies. Subsequent starts reuse Docker layers and volumes.

| Service | Local address |
| --- | --- |
| Website, registration and account | http://localhost:3010 |
| Custom admin | http://localhost:3010/admin |
| Django admin | http://localhost:8010/django-admin/ |
| API documentation | http://localhost:8010/api/schema/swagger-ui/ |
| Readiness | http://localhost:8010/health/ready/ |
| Captured development email | http://localhost:8030 |
| PostgreSQL / Redis | localhost:5440 / localhost:6390 |

Register through the website and open the verification message in Mailpit. No real email provider is required locally. Create your administrator interactively:

```sh
python scripts/tasks.py superuser
```

There is no shared/default administrator password. Bootstrap keeps existing configuration and creates fresh secrets for new copies.

## Included

- Django 6, DRF, PostgreSQL, modular environment settings, OpenAPI, service/selector boundaries, reusable response/error envelopes and pagination.
- Email registration and verification, password reset/change, email change, account deletion API, sessions, token rotation/revocation, lockout, trusted devices and security events. TOTP/MFA with recovery codes is available end to end: `/profile/two-factor` handles enrollment, recovery-code regeneration and disabling, and the login form handles MFA challenges. Account deletion is in the profile's danger zone; it requires the password plus a second-factor code when MFA is on, and a daily task anonymizes deleted accounts after `ACCOUNT_DELETION_GRACE_DAYS` (30 by default). Optional Google sign-in works end to end once `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set: the login and register pages then show "Continue with Google".
- Profile forms, session management, staff-only server guards, responsive admin sidebar, real account totals and generic searchable/paginated user management.
- Next.js 16, React, TypeScript, Tailwind, reusable UI/form components, React Query, Zustand, metadata, sitemap, robots and error screens.
- Au Coeur's BFF cookie handling: access/refresh tokens stay in HttpOnly cookies. Browser requests use same-origin routes, with origin validation on mutations.
- Celery worker and database-backed Beat scheduler, Redis, Mailpit, templated email and validated image upload to local storage or Cloudflare R2.
- Docker development/production stacks, Nginx TLS routing, non-root production processes, health checks, migration job, local and optional off-host backups.
- Backend/frontend checks, dependency audits, PostgreSQL and email integration CI, and production HTTPS browser/restore tests. Exact-commit GHCR publishing and SSH deployment are opt-in per project, with immutable image references and a daily verified backup scheduler.
- Production configuration preflight, pinned CI actions, SBOM/provenance generation, scheduled dependency checks, and regression tests for failed releases and safe project copying.

The media endpoint is a reusable upload service, not an asset-library database. Google sign-in requires your own OAuth client, with `<frontend origin>/auth/callback/google` registered as a redirect URI. Configure production SMTP, storage, hostname and certificates before deployment.

## Common commands

```sh
python scripts/tasks.py test
python scripts/tasks.py validate-production
python scripts/smoke.py
python scripts/tasks.py lint
python scripts/tasks.py migrate
python scripts/tasks.py schema
python scripts/tasks.py logs
python scripts/tasks.py backup
python scripts/tasks.py down
```

`down` preserves database/media volumes. Equivalent `make` targets are included. Production backup uses `python scripts/tasks.py backup --production`.

Production validation requires installed frontend dependencies and Playwright Chromium (`pnpm exec playwright install chromium` in `frontend`). It builds an isolated stack and stops it when finished. Follow [deployment setup](docs/DEPLOYMENT.md) to configure GitHub release/deployment variables, SSH secrets, your VPS, TLS and private backups.

## Use it for another project

```sh
python scripts/create-project.py ../my-new-project --name "My New Project"
```

This copies the source without dependencies, secrets, local data or Git history, changes the environment's name/slug and bootstraps new secrets. Select distinct ports in the new `.env` if both projects will run together; cookies are namespaced by project. Keep `frontend/.env.local` and `backend/.env` origins consistent with those ports when running outside Docker.

## Structure

```text
backend/apps/users/       Identity, authentication and account security
backend/apps/profiles/    Profile and address services
backend/apps/dashboard/   Staff-only account totals
backend/core/             API primitives, security, storage and roles
backend/config/           Environment-specific settings and routes
backend/infrastructure/   Email, Redis, queue and monitoring adapters
frontend/app/             Pages, account/admin routes and BFF endpoints
frontend/components/      Copied UI primitives and authentication guards
frontend/lib/             API clients, query configuration and auth helpers
frontend/config/          Site identity
infra/                    Docker, Nginx and backup implementations
scripts/                  Bootstrap, task runner and project copying
contracts/openapi/        Generated API contract
docs/                     Architecture, deployment and source provenance
```

Read [architecture and extension points](docs/ARCHITECTURE.md), [deployment](docs/DEPLOYMENT.md), [testing](docs/TESTING.md) and [source provenance](docs/PROVENANCE.md).

For team adoption, read the [operating contract](docs/OPERATIONS.md), [contribution guide](CONTRIBUTING.md) and [security policy](SECURITY.md). They define ownership, recovery expectations, maintenance and the additional controls needed for multi-tenant or highly available enterprise deployments.

See [the local validation record](docs/VALIDATION.md) for the checks performed and remaining deployment-specific setup.
