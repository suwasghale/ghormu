# Deployment and CI/CD

The release pipeline is copied from Au Coeur du Népal and adapted for this starter. It targets one Linux VPS with Docker Compose and GHCR images. No external host, domain, bucket or GitHub configuration is provisioned by these files.

See [OPERATIONS.md](OPERATIONS.md) for the production configuration contract, CI supply-chain controls, monitoring ownership and workload-specific availability requirements. Run `check-env --require-backup` before enabling deployment; the original placeholder environment intentionally fails this check.

## Pipeline

Pull requests run backend lint/format, SQLite and PostgreSQL tests, migration/schema/production-settings checks, frontend types/lint/unit/build checks, dependency audits, the email/account integration flow, and production-container browser and backup tests.

On `main`, `publish.yml` calls all four validation workflows at that same revision. When `ENABLE_RELEASES=true`, it publishes:

```text
ghcr.io/owner/repository-backend:FULL_COMMIT_SHA
ghcr.io/owner/repository-frontend:FULL_COMMIT_SHA
ghcr.io/owner/repository-backup:FULL_COMMIT_SHA
```

Production validation builds the Dockerfiles with isolated test settings. Publication rebuilds that revision with the project's public origin/name/media settings; it does not promote the exact test image bytes. Deployment then pins the published content digests.

When `ENABLE_DEPLOYMENTS=true`, `deploy.yml` verifies successful main-branch publication and all three image jobs before sending the exact SHA to the VPS. Automatic deployment rejects a revision superseded on main. Manual dispatch accepts a full previously published SHA. Deployments are serialized and never cancelled during migration.

`deploy.sh` locks deployment, rejects tracked local changes, records running images, validates configuration, pulls the release and pauses the backup scheduler. Existing databases require a private off-host dump and scratch restore before migration. The script resolves image tags to immutable digests and atomically saves those references in the production env file. It runs Django's deployment checks, starts migration/app services, recreates Nginx, verifies HTTPS routes, and performs another backup/restore. The daily backup scheduler must become healthy before `.deployment/current-sha` is written.

This single-host service replacement can briefly interrupt requests. Migrations must remain compatible with active writers; use a maintenance window for incompatible changes. There is no automatic database rollback.

## One-time project setup

1. Create the project's GitHub repository with a `main` branch. Commit the copied starter and non-secret project configuration. Require passing PR checks and restrict workflow changes and pushes to main.
2. Prepare a Linux VPS with Docker Engine, Compose **2.24.4 or newer**, Git, Python 3, curl and `flock` (util-linux). The deploy user needs Docker access, write access to the checkout and Git repository read access. Open HTTP, HTTPS and your SSH port; keep database/application ports private. Allow disk space for retained images, database dumps and scratch restores.
3. Clone into a dedicated directory such as `/srv/my-project`. For private GHCR packages, authenticate the deploy user's Docker client using a read-only package credential and `docker login ghcr.io --username YOUR_USER --password-stdin`. Configure a read-only Git deploy key if required. CI publishes with its own `GITHUB_TOKEN`.
4. On the VPS, copy `backend/.env.production.example` to `backend/.env.production` and restrict it to the deploy user. Use simple unquoted `KEY=value` entries. Generate independent signing keys with `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`; configure PostgreSQL, Redis, SMTP, a unique `APP_SLUG`, and the origin. `FRONTEND_URL`, `NEXT_PUBLIC_SITE_URL` and GitHub `SITE_URL` must agree. Configure CORS, CSRF and `ALLOWED_HOSTS` consistently; include internal hostname `web`.
5. Replace `example.com` in `infra/nginx/sites/app.conf` in the repository and **commit that non-secret change**. On the VPS, put a valid certificate chain and key at ignored paths `infra/nginx/certs/fullchain.pem` and `privkey.pem`. Use actual files, not symlinks outside the mounted directory. Configure your certificate client's renewal hook to copy renewed files there and reload Nginx. Initial issuance can use standalone ACME before the stack starts; webroot renewal must share the Compose `certbot_webroot` volume. Monitor expiry. Cloudflare origin certificates require Cloudflare Full (strict); direct-origin smoke checks require a publicly trusted certificate.
6. Create a **private** backup bucket separate from public media. Configure `BACKUP_BUCKET`, `BACKUP_ACCESS_KEY_ID`, `BACKUP_SECRET_ACCESS_KEY`, `BACKUP_ENDPOINT_URL`, `BACKUP_REGION` and retention. R2 uses region `auto`; other S3 providers may require their regional value. Restrict credentials to list/read/write/delete on this bucket. The bundled PostgreSQL role can create scratch restore databases; separately provisioned backup roles need that permission.
7. Add the GitHub settings below. Enable publication, then push a reviewed commit to main. Once the server is ready, enable deployment and dispatch Deploy with the published full SHA, or push the next reviewed release. A new project runs checks by default and publishes/deploys only when enabled.

Repository **Actions variables**:

| Variable | Value |
| --- | --- |
| `ENABLE_RELEASES` | `true` enables GHCR publication after all tests |
| `ENABLE_DEPLOYMENTS` | `true` enables VPS deployment |
| `SITE_URL` | HTTPS origin, e.g. `https://my-project.com` |
| `DEPLOY_DIR` | Absolute checkout path, e.g. `/srv/my-project` |
| `APP_NAME` | Optional name compiled into the frontend |
| `MEDIA_HOST` | Public media hostname when using object storage |

Create a GitHub environment named **production**. Store these as environment secrets (repository secrets also work), and configure project-appropriate environment deployment protections:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | Server hostname or IP |
| `VPS_USER` | Deployment SSH user |
| `VPS_SSH_KEY` | Dedicated private deployment key |
| `VPS_HOST_FINGERPRINT` | Trusted `SHA256:...` SSH host fingerprint |

Verify the fingerprint from the server console using `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256`. Missing connection settings fail before SSH. The workflow uses port 22; set the action's `port` for a different SSH port. Application and bucket credentials stay in the server's ignored env file.

## Operating releases

Manual deployment on the Linux VPS uses the same script:

```sh
export IMAGE_NAMESPACE=ghcr.io/owner/repository
export DEPLOY_SITE_URL=https://my-project.com
python3 scripts/tasks.py check-env --require-backup
python3 scripts/tasks.py deploy --release-sha FULL_PUBLISHED_SHA
python3 scripts/tasks.py superuser --production
```

Use a SHA with a successful publication. GitHub verifies run history; the local script checks SHA format, main ancestry and image availability. Do not use `build` on a released server: deployment pulls published images. `python scripts/tasks.py build` is for local image development. Full image references belong in `BACKEND_IMAGE`, `FRONTEND_IMAGE` and `BACKUP_IMAGE`; there is no separate `RELEASE_TAG`.

Nginx serves one HTTPS origin. `/api/v1/`, `/health/`, `/django-admin/` and backend static files go to Django; BFF routes and other pages go to Next. Database/application ports remain private. The bundled PostgreSQL connection uses `DB_SSLMODE=disable` inside Docker's private network; use TLS for a managed database. The default role owns the schema; separating migration/runtime roles requires project-specific provisioning.

For R2 uploads, enable `USE_CLOUD_STORAGE` and fill the R2 settings. Use the same public hostname for `R2_CUSTOM_DOMAIN` and GitHub `MEDIA_HOST`. Republish after changing frontend build settings. Cloudflare is optional; never cache authenticated routes, API responses or responses setting session cookies. The included refresh coordination supports one frontend instance; distributed coordination is needed before horizontal scaling.

## Backups and recovery

Deployment starts `backup-scheduler`, copied from Au Coeur: an immediate dump/restore followed by a daily cycle. It exits on failure and Docker restarts it; its healthcheck rejects a restore older than 25 hours. Monitor health, backup age and logs externally. Successful uploads prune objects older than `BACKUP_RETENTION_DAYS` under `BACKUP_PREFIX`. Database dumps exclude local media; back up that volume separately or use object storage with a recovery policy.

Run an additional off-host backup and scratch restore with:

```sh
python3 scripts/tasks.py backup-verify --production
```

`backup --production` instead writes a local custom-format dump under ignored `backups/`, without automatic retention or off-host copy. `restore --production --file backups/FILE.dump --confirm-database EXACT_DATABASE_NAME` intentionally replaces matching database objects; stop writers before recovery. The off-host restore entrypoint supports `--list` and `--into NEW_DATABASE OBJECT_KEY`, and refuses the live database name.

A failed release exits nonzero without advancing `.deployment/current-sha`. Some services or the env file may already reference candidate images. Inspect the failure and `.deployment/previous-images.env`, `.deployment/previous-sha` and `.deployment/current-images.env`. A first installation may have no prior release. Verify schema compatibility before restoring old code.

After confirming compatibility, recover the prior checkout and images without rerunning migrations:

```sh
git checkout --detach "$(cat .deployment/previous-sha)"
python3 infra/release_env.py --images .deployment/previous-images.env
docker compose --env-file backend/.env.production -f docker-compose.prod.yml up -d --no-build --no-deps --wait web worker beat frontend
docker compose --env-file backend/.env.production -f docker-compose.prod.yml up -d --no-build --no-deps --force-recreate nginx
python3 infra/smoke.py --site https://my-project.com --api https://my-project.com
docker compose --env-file backend/.env.production -f docker-compose.prod.yml up -d --no-build --no-deps --wait backup-scheduler
```

Record the recovered image references and SHA after verification. Retain previous GHCR images. Incompatible schemas need a separately reviewed database recovery procedure; deployment never reverses migrations or deletes volumes. If a failed deployment left the scheduler stopped, restart it after recovery.

## Host verification and monitoring

Run `python scripts/tasks.py validate-production` before enabling releases; see [TESTING.md](TESTING.md). Local MinIO, Mailpit and temporary TLS test the integrations without provider credentials. On each real host, verify SMTP delivery, bucket permissions, DNS and certificate renewal. `check_services --email-to YOUR_ADDRESS` inside the web container sends a real test email.

Monitor `/health/ready/` over HTTPS, container health, disk space, certificate expiry and Celery/Beat logs. `/health/` is dependency-independent liveness. Beat is a singleton with no HTTP health endpoint. Optional `SENTRY_DSN` enables backend reporting. Docker logs are bounded; external monitoring accounts remain project-specific setup.
