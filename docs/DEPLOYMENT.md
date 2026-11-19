# Deployment and CI/CD

Every project built from this starter deploys the same way, to a Linux VPS
that can host several sites at once. What differs between projects lives in
one committed file, [`deploy/site.env`](../deploy/site.env). Nothing in nginx,
Compose, the workflows or the scripts is edited per project.

```text
                         ┌──────────── one VPS ─────────────────────────────────┐
visitor ──80/443──▶ edge (/srv/edge) ──SNI/Host──▶ 127.0.0.1:EDGE_*_PORT        │
                         │                          site nginx (TLS, its own cert)│
                         │                            ├── Next.js               │
                         │                            └── Django · Celery · beat │
                         │                          Postgres · Redis · backups   │
                         │                          certbot (issues and renews)  │
                         └──────────────────────────────────────────────────────┘
```

| What | Where | Who writes it |
| --- | --- | --- |
| Site identity: domain, aliases, ports, server path | `deploy/site.env` (committed) | `create-project.py`, then you |
| Secrets: keys, passwords, SMTP, backup bucket | `backend/.env.production` (server only) | `scripts/server.py init-env` |
| Routes from the edge to each site | `/srv/edge/sites/<slug>.*.map` | `deploy.sh`, via `scripts/edge.py` |
| Certificates | the `letsencrypt` Docker volume | the `certbot` service |
| GitHub | 2 variables, 4 secrets | you, from `scripts/server.py github` |

The order of work for a new site:

1. [Create the project](#1-create-the-project) (PC)
2. [Prepare the server](#2-prepare-the-server-once-per-server) (once per server)
3. [DNS and outside services](#3-dns-and-outside-services)
4. [Add the site to the server](#4-add-the-site-to-the-server)
5. [First release](#5-first-release)
6. [Automatic deployments](#6-automatic-deployments)

Commands marked **PC** run on your computer, **VPS** on the server over SSH.
Never paste a password, private key or token into a chat or a commit.

---

## 1. Create the project

**PC**

```sh
python scripts/create-project.py ../my-site --name "My Site" --domain mysite.com --repo OWNER/my-site --email you@mysite.com
```

This copies the starter without dependencies, secrets or history, and fills
in `deploy/site.env`:

- `SITE_DOMAIN`, and `www.` as a redirecting alias for an apex domain;
- `DEPLOY_DIR=/srv/my-site`;
- a loopback port pair for the edge, derived from the name, so sites on one
  server do not collide (`deploy.sh` refuses a pair another site already has);
- local development ports derived the same way, so projects run side by side.

Read `deploy/site.env` once and adjust anything. Create the GitHub repository,
push `main`, and keep the default branch protected.

## 2. Prepare the server (once per server)

A fresh Ubuntu 24.04 VPS. Put your SSH key on it (most providers ask for one
when ordering; otherwise `ssh-copy-id root@SERVER`), then:

**PC**

```sh
scp infra/server/bootstrap.sh root@SERVER:/root/
ssh root@SERVER bash /root/bootstrap.sh --timezone Asia/Kathmandu
```

It installs Docker and Compose, creates the `deploy` user (with your key),
turns on the firewall (SSH, 80, 443 only), fail2ban, automatic security
updates and swap, prepares `/srv` and `/srv/edge`, and installs
`sg-deploy-key`. Compare the host key fingerprints it prints with your
provider's console.

In a **second** window, check `ssh deploy@SERVER` works, set a sudo password
with `sudo passwd deploy` from the root window, then lock SSH down:

```sh
ssh root@SERVER bash /root/bootstrap.sh --harden-ssh
```

From now on connect as `deploy`. A server that already runs sites from before
this version keeps them: see [EDGE.md](EDGE.md#an-existing-server).

## 3. DNS and outside services

**DNS** (registrar or Cloudflare): `A` records for `SITE_DOMAIN` and each
alias, pointing at the server. Add `AAAA` only if the server's IPv6 works
(`ping -6 google.com` on it): a wrong `AAAA` breaks certificate issuance for
IPv6 visitors. On Cloudflare keep **DNS only** (grey cloud) until the first
certificate exists.

**Backup bucket** (Cloudflare R2: free up to 10 GB): a **private** bucket,
e.g. `my-site-backups`, and an API token with Object Read & Write on that
bucket only. Note the bucket, key ID, secret and endpoint
`https://<account-id>.r2.cloudflarestorage.com`. Deployment refuses to run
without it.

**SMTP** for account emails (Brevo, Zoho, Resend, Postmark…): verify the
domain and add the SPF and DKIM records the provider gives, or mail lands in
spam.

## 4. Add the site to the server

**VPS**, as `deploy`. A read-only key for this repository, then the checkout:

```sh
sg-deploy-key my-site
# add the printed key on GitHub: repository > Settings > Deploy keys (no write access)
git clone git@github-my-site:OWNER/my-site.git /srv/my-site
```

Images on GHCR are private by default. Sign Docker in once per server with a
classic token that has only `read:packages`, typed at the prompt:

```sh
docker login ghcr.io --username YOUR_GITHUB_USER
```

Then the secrets and a check of everything:

```sh
cd /srv/my-site
python3 scripts/server.py init-env
python3 scripts/server.py doctor
```

`init-env` takes the domain, origins, CORS/CSRF, allowed hosts, database
names and cookie prefix from `deploy/site.env`, generates every key and
password, and asks only for SMTP and the backup bucket (secret answers are
hidden). It writes `backend/.env.production` readable by `deploy` only, and
`--force` re-asks the questions while keeping the generated secrets, which a
live database and signed-in users depend on.

`doctor` checks Docker and Compose versions, Git and GHCR access, the secrets
file and its permissions, that every hostname resolves to this server and
nowhere else, disk and swap, and that no other site on the server already
uses this site's names or ports. Fix what it reports before the first
release.

## 5. First release

**GitHub** → repository → Settings → Secrets and variables → Actions →
Variables: `ENABLE_RELEASES` = `true`. Push to `main` (or run **Publish
images**). When it is green, copy the full commit SHA it published.

The first deployment is best run by hand, so you see every step:

**VPS**

```sh
cd /srv/my-site
bash deploy.sh FULL_COMMIT_SHA
python3 scripts/tasks.py superuser --production
```

`deploy.sh` pulls the images, backs up and restore-tests an existing database
before migrating, starts the stack, registers the site with the edge
(installing the edge on a new server, or migrating a hand-written one),
issues the Let's Encrypt certificate, switches HTTPS on, runs the smoke test
over HTTPS and takes a verified off-host backup. Then sign in and turn on
two-step verification for your account.

Certificates renew by themselves: the `certbot` service tries twice a day and
nginx reloads when the files change. There is no hook or cron job to set up.
A certificate covering new names is issued by the next release after
`SITE_ALIASES` changes.

## 6. Automatic deployments

**VPS**

```sh
python3 scripts/server.py github --create-key
```

It creates a key for GitHub Actions to sign in with and prints exactly what to
enter. In GitHub → Settings → Environments → New environment `production` →
Environment secrets:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | the server's IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | the private key it created (`cat ~/.ssh/github_actions`) |
| `VPS_HOST_FINGERPRINT` | the **ECDSA** `SHA256:…` value it prints |

The fingerprint must be the ECDSA one: the deploy action's SSH client prefers
ECDSA, and an Ed25519 fingerprint fails with "host key fingerprint mismatch".
Delete the private key from the server once it is saved in GitHub.

Then set the variable `ENABLE_DEPLOYMENTS` = `true`. Every green push to
`main` is now tested, published and deployed, and the **Uptime** workflow
checks the live site every 15 minutes. Nothing else is configured in GitHub:
the site URL, server path, app name and media host are read from
`deploy/site.env` at the release being deployed.

---

## Pipeline

Pull requests run backend lint/format, SQLite and PostgreSQL tests,
migration/schema/production-settings checks, frontend types/lint/unit/build
checks, dependency audits, the email/account integration flow, and
production-container browser and backup tests.

On `main`, `publish.yml` calls all four validation workflows at that same
revision. When `ENABLE_RELEASES=true`, it publishes:

```text
ghcr.io/owner/repository-backend:FULL_COMMIT_SHA
ghcr.io/owner/repository-frontend:FULL_COMMIT_SHA
ghcr.io/owner/repository-backup:FULL_COMMIT_SHA
```

The frontend is built with the origin, name and media host from
`deploy/site.env`; a placeholder domain fails the build. Deployment pins the
published content digests.

When `ENABLE_DEPLOYMENTS=true`, `deploy.yml` verifies a successful
main-branch publication of all three images before sending the exact SHA to
the VPS. Automatic deployment rejects a revision superseded on main; manual
dispatch accepts a full previously published SHA (pasted whitespace is
tolerated). Deployments are serialized and never cancelled during migration.

`deploy.sh` locks deployment, rejects tracked local changes, validates
`deploy/site.env` and checks `backend/.env.production` against it, records
running images, pulls the release and pauses the backup scheduler. Existing
databases require a private off-host dump and scratch restore before
migration. It resolves image tags to immutable digests, runs Django's
deployment checks, starts migration/app services, routes the site through the
edge, ensures the certificate, recreates nginx, verifies HTTPS routes and
performs another backup/restore. The daily backup scheduler must become
healthy before `.deployment/current-sha` is written.

This single-host service replacement can briefly interrupt requests.
Migrations must remain compatible with active writers; use a maintenance
window for incompatible changes. There is no automatic database rollback.

## Operating

```sh
cd /srv/my-site
alias dc='docker compose --env-file deploy/site.env --env-file backend/.env.production -f docker-compose.prod.yml'
dc ps                             # every service healthy
dc logs -f --tail 100 web         # Django
dc logs --tail 50 certbot nginx   # certificates
python3 scripts/edge.py status    # every site on the server
python3 scripts/server.py doctor  # re-check after a change
```

Change the domain or aliases by editing `deploy/site.env`, committing, and
releasing: the release re-registers the edge routes and extends the
certificate. Change a secret with `nano backend/.env.production` (plain
`KEY=value`, no quotes) and redeploy.

Uploads to R2: set `USE_CLOUD_STORAGE=True` and the `R2_*` settings in
`backend/.env.production`, and the same public hostname as `MEDIA_HOST` in
`deploy/site.env` (it is compiled into the frontend). Cloudflare in front of
the site is optional; never cache authenticated routes, API responses or
responses setting session cookies. The included refresh coordination supports
one frontend instance.

## Backups and recovery

Deployment starts `backup-scheduler`: an immediate dump and scratch restore,
then a daily cycle. It exits on failure and Docker restarts it; its
healthcheck rejects a restore older than 25 hours. Successful uploads prune
objects older than `BACKUP_RETENTION_DAYS` under `BACKUP_PREFIX`. Database
dumps exclude local media; back up that volume separately or use object
storage with a recovery policy.

```sh
python3 scripts/tasks.py backup-verify --production   # another off-host backup + scratch restore
python3 scripts/tasks.py backup --production          # a local dump under backups/
```

`restore --production --file backups/FILE.dump --confirm-database EXACT_NAME`
replaces matching database objects; stop writers first. The off-host restore
entrypoint supports `--list` and `--into NEW_DATABASE OBJECT_KEY`, and refuses
the live database name.

A failed release exits nonzero without advancing `.deployment/current-sha`.
Inspect `.deployment/previous-images.env`, `.deployment/previous-sha` and
`.deployment/current-images.env`. After confirming schema compatibility,
recover the prior release without rerunning migrations:

```sh
git checkout --detach "$(cat .deployment/previous-sha)"
python3 infra/release_env.py --images .deployment/previous-images.env
dc up -d --no-build --no-deps --wait web worker beat frontend
dc up -d --no-build --no-deps --force-recreate nginx
python3 infra/smoke.py --site https://mysite.com --api https://mysite.com
dc up -d --no-build --no-deps --wait backup-scheduler
```

Incompatible schemas need a separately reviewed database recovery procedure;
deployment never reverses migrations or deletes volumes.

## Monitoring

The **Uptime** workflow checks the pages, `/health/ready/`, robots, sitemap,
every alias's redirect and the certificate's expiry every 15 minutes, and
GitHub emails a failure. Also watch disk space, container health and
Celery/Beat logs; optional `SENTRY_DSN` enables backend error reporting.
`check_services --email-to YOUR_ADDRESS` inside the web container sends a
real test email.

Run `python scripts/tasks.py validate-production` before enabling releases on
a new project; see [TESTING.md](TESTING.md). It exercises the production
images, nginx templates, RustFS and Mailpit locally; it does not prove the real
SMTP account, bucket permissions or DNS, which `server.py doctor` and the first
release do.
