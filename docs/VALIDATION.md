# Validation record

## Deployment completion — 22 September 2026

The Au Coeur release, production-testing and backup files were copied and adapted, then verified locally on Windows/Docker Desktop. Linux-only release behavior was exercised inside a disposable container.

| Check | Result |
| --- | --- |
| Backend SQLite suite | 214 passed, 1 skipped (Redis-specific test uses the unit-test cache) |
| Backend PostgreSQL suite with updated lock | 214 passed, 1 skipped; host connection uses IPv4 `127.0.0.1` |
| Backend Ruff lint / format | Passed; 320 files |
| Frozen production dependency audit | No known vulnerabilities after upgrading `anyio` 4.14.1 to 4.14.2 for three reported advisories |
| Frontend types, ESLint, Vitest and dependency audit | Passed; 18 unit tests; no known vulnerabilities reported |
| Production images | Backend, frontend and backup built; production Django checks passed |
| Production HTTPS smoke | Homepage, login, liveness, readiness, OpenAPI and admin CSS passed with certificate verification |
| Playwright against production containers | 8 passed: MFA, invalid refresh, two-tab renewal, API outage/retry, large image upload, private backup/restore, login limit, image-failure caching |
| Scheduled private backup | Dump uploaded to MinIO, restored into a scratch PostgreSQL database, account count checked; scheduler became healthy |
| Linux release tests | 9 passed, including failed atomic writes, publication gates and real-script simulations of backup/migration/smoke failures, plus fresh/existing database deployment paths |
| Workflow / shell validation | actionlint, ShellCheck and shell syntax passed |
| Fresh project generation | Release/test files retained; credentials, generated TLS, reports, release state and dependencies excluded; new secrets generated |
| Test cleanup | All `ghormu-e2e` containers and its network stopped/removed; test volumes retained |

The production browser suite used the real production Dockerfiles with an isolated Compose overlay, MinIO and Mailpit. It did not contact external SMTP, R2 or a real VPS. GitHub Actions publication and SSH deployment have been validated locally but have not been executed in a configured GitHub repository or on an external host. Enable them only after the per-project setup in [DEPLOYMENT.md](DEPLOYMENT.md). Release tests mock external commands; they complement the real local container checks and do not prove SSH credentials or a remote registry configuration.

## Earlier foundation validation

Completed locally on Windows with Docker Desktop, 19 September 2026.

| Check | Result |
| --- | --- |
| Backend host suite (SQLite) | 214 passed, 1 skipped: Redis-specific check uses the test cache |
| Backend container suite (PostgreSQL) | 211 passed, 4 skipped: three host infrastructure checks are outside its mount, plus the test-cache check |
| Backend Ruff lint and format | Passed, 320 files checked |
| Migration consistency | No changes detected |
| OpenAPI v1 | Generated with explicit API version; schema validation passes without warnings |
| Frontend TypeScript, ESLint and Vitest | Passed; 18 tests including account-cache isolation |
| Frontend dependency audit | No known vulnerabilities reported by pnpm audit |
| Next.js production build | Passed |
| Production Docker images | Backend and frontend built successfully |
| Production Compose | Fresh isolated database migrated; API, frontend, worker and stores became healthy |
| Local production HTTPS | Certificate verified against a temporary test CA; homepage, login, readiness and schema returned 200; unauthenticated BFF returned 401 |
| Django production checks | No issues, with independent temporary signing keys |
| Live account smoke | Registration, queued Mailpit email, verification, HttpOnly cookies, profile, sessions, staff restriction, refresh, logout, recovery and deactivation passed |
| Browser review | Homepage, administrator login, dashboard, user table and profile editing checked; saved profile changes appeared immediately |
| Database recovery | Custom-format dump restored into a separate database; account counts matched; disposable restore database removed |
| Project generator | Fresh copy bootstrapped with renamed identity and independent secrets; secrets, Git history, dependencies, pnpm store and runtime data excluded |

The temporary production stack was stopped after verification. The development stack remains available at http://localhost:3010, with Mailpit at http://localhost:8030. Disposable browser administrator credentials were revoked. Inactive smoke account records remain in the development database; they are excluded when creating a new project.

No live domain, external SMTP provider, R2 bucket, Sentry account or remote backup destination was provisioned or contacted. Those integrations require the next project's own credentials. Google sign-in is implemented end to end but needs the next project's own OAuth client to exercise against Google. The frontend uses one server instance; distributed refresh coordination is required before horizontal scaling.
