# Validation

With development Compose running:

```sh
python scripts/tasks.py test
python scripts/tasks.py lint
docker compose -f docker-compose.dev.yml exec -T -e TEST_DATABASE=postgres backend pytest -q
docker compose -f docker-compose.dev.yml exec -T backend python manage.py makemigrations --check --dry-run
```

Host development uses Python 3.14, uv and Node 22.12–24 with pnpm 11.20.0. Run `uv sync --frozen` in `backend` and `pnpm install --frozen-lockfile` in `frontend`. Use `uv run pytest`, `uv run ruff check apps core config tests`, and `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

The copied backend suite exercises account lifecycle, password flows, MFA, token replay, session revocation, trusted devices, profile permissions, administrative lockout, role synchronization, email templates and health/schema behavior. Frontend tests cover safe return paths, refresh coordination and mutation origins. Starter-specific tests verify dashboard permissions and absence of business-domain apps.

CI runs both SQLite and PostgreSQL tests plus frontend checks. A green unit suite does not prove TLS, SMTP, R2 or a restore works on your eventual host; validate those with that project's configuration before release.

## Production containers and recovery

Install frontend dependencies first, then install the test browser:

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
cd ..
python scripts/tasks.py validate-production
```

Linux CI uses `playwright install --with-deps chromium`. Docker Compose 2.24.4+ and OpenSSL are required; on Windows, the runner can use OpenSSL bundled with Git. The runner creates temporary TLS and local-only credentials, builds all three production images, migrates a PostgreSQL database and tests Nginx, Next, Django, Redis, Celery, MinIO and Mailpit. It never reads production credentials. HTTPS smoke verifies its generated certificate; Chromium ignores that local certificate's trust error while exercising the UI.

The copied browser suite covers MFA recovery, expired refresh rejection, simultaneous two-tab refresh, recovery after an API outage, large image uploads, private bucket access and scratch restore, production login throttling, and uncached image failures. The daily backup scheduler must also become healthy after an actual backup and restore. Frontend unit tests and the separate Mailpit account smoke retain the remaining auth/profile coverage.

This suite exclusively uses Compose project `ghormu-e2e`, database `ghormu_e2e`, ports 8446/8086/8036 and the reserved `starter.test` hostnames. No DNS/hosts-file changes are needed. Do not run two copies simultaneously on one Docker host. The tests briefly stop only the test API and seed known credentials guarded by the test database name; never point these fixtures at a real deployment.

`python infra/e2e/run.py --keep-running` leaves the isolated stack for diagnosis; `--skip-build` reuses already-built test images. Normal completion or failure stops it while preserving volumes. Failure output includes service status/logs; CI retains browser traces/screenshots for three days. Reports, credentials and fixtures under `infra/e2e/generated` are ignored and excluded from project copies. Regenerate the certificate with a new runner invocation. If manually discarding test volumes, discard their generated env file together so new credentials do not conflict with retained PostgreSQL/Redis data.

## Release gates

`python -m unittest discover -s infra/tests -p 'test_*.py'` runs atomic environment-write and workflow gate tests with the backend environment (PyYAML installed). On Linux with `flock`, it also executes the real deployment script against mocked external commands, proving backup/migration/smoke failures cannot mark a release successful and fresh/existing database paths complete correctly. These Linux tests are skipped on Windows; they run in CI. CI also runs actionlint, ShellCheck, shell syntax checks, `pnpm audit`, and `pip-audit` against the frozen production dependency export. The publish workflow requires backend, frontend, account integration and production-container validation at the same commit. Release publication/deployment remain disabled until configured as described in [DEPLOYMENT.md](DEPLOYMENT.md).

`python scripts/smoke.py` verifies the real BFF account flow, Celery email delivery to Mailpit, cookie flags, staff permissions, profile updates, refresh/logout, password recovery and account deactivation. It accepts local frontend/mail ports, creates a disposable example.com account and deactivates it after success. Inactive smoke accounts remain as test records. The integration CI job starts the full Compose stack and runs this check.

Generate the contract with `python scripts/tasks.py schema`, which explicitly supplies `--api-version v1`. Namespace-versioned schemas can otherwise be valid YAML with no paths. The checked-in contract contains the complete v1 API.
