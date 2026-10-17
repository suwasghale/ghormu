#!/bin/bash
set -euo pipefail

# Manual deployment remains available: ./deploy.sh <tested full commit SHA>.
# CI verifies that all required validation jobs published this exact release.
RELEASE_SHA="${1:-${RELEASE_SHA:-}}"
if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Usage: ./deploy.sh <validated 40-character commit SHA>" >&2
    exit 2
fi
IMAGE_NAMESPACE="${IMAGE_NAMESPACE:?Set the GHCR repository namespace, e.g. ghcr.io/owner/repository}"
if [[ ! "$IMAGE_NAMESPACE" =~ ^ghcr\.io/[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9._-]*$ ]]; then
    echo "Invalid image registry namespace" >&2
    exit 2
fi
: "${DEPLOY_SITE_URL:?Set the production HTTPS origin}"
cd "${DEPLOY_DIR:-$PWD}"
mkdir -p .deployment
exec 9>.deployment/deploy.lock
flock -n 9 || { echo "Another deployment is running" >&2; exit 1; }
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Tracked VPS files have local changes; deployment stopped before modifying them" >&2
    exit 1
fi
git fetch origin main "$RELEASE_SHA"
git merge-base --is-ancestor "$RELEASE_SHA" origin/main || {
    echo "Release must belong to the main branch" >&2; exit 1;
}

dc() { docker compose --env-file backend/.env.production -f docker-compose.prod.yml "$@"; }
# Every `dc run` below is `-T ... </dev/null`: a container run reads stdin by
# default, and when this script is itself fed through stdin that read eats
# the rest of the script -- the deploy then stops after the backup and
# still exits 0. See the note in .github/workflows/deploy.yml.
# Image names are not secrets. Keep the last running references before changing
# the checkout; schema compatibility must still be checked before any rollback.
previous_file=".deployment/previous-images.env"
if [[ -f .deployment/current-images.env && -f .deployment/current-sha ]]; then
    # A failed attempt may already have swapped some containers. Always retain
    # the last verified release, not that partially deployed candidate.
    cp .deployment/current-images.env "$previous_file"
    cp .deployment/current-sha .deployment/previous-sha
elif [[ ! -f "$previous_file" ]]; then
    # Compatibility with the first release on a manually provisioned server.
    # Keep this snapshot across failed retries until a verified release exists.
    if [[ -f .deployment/current-sha ]]; then
        cp .deployment/current-sha .deployment/previous-sha
    fi
    : > "$previous_file"
    for pair in web:BACKEND_IMAGE frontend:FRONTEND_IMAGE backup-scheduler:BACKUP_IMAGE; do
        service="${pair%%:*}"; variable="${pair##*:}"
        container="$(dc ps -q "$service")"
        if [[ -n "$container" ]]; then
            image="$(docker inspect --format '{{.Config.Image}}' "$container")"
            printf '%s=%s\n' "$variable" "$image" >> "$previous_file"
        fi
    done
fi

trap 'echo "Deployment failed. Review .deployment/previous-images.env and docs/DEPLOYMENT.md; no database rollback was attempted." >&2' ERR
git checkout --detach "$RELEASE_SHA"
export BACKEND_IMAGE="${IMAGE_NAMESPACE}-backend:${RELEASE_SHA}"
export FRONTEND_IMAGE="${IMAGE_NAMESPACE}-frontend:${RELEASE_SHA}"
export BACKUP_IMAGE="${IMAGE_NAMESPACE}-backup:${RELEASE_SHA}"
python3 scripts/tasks.py check-env --require-backup
# Site identity is compiled into the frontend; do not deploy with a different origin.
python3 -c 'import os; from pathlib import Path; values=dict(line.split("=",1) for line in Path("backend/.env.production").read_text().splitlines() if "=" in line and not line.startswith("#")); assert values["NEXT_PUBLIC_SITE_URL"].rstrip("/") == os.environ["DEPLOY_SITE_URL"].rstrip("/"), "SITE_URL must match NEXT_PUBLIC_SITE_URL"'
dc config --quiet
dc pull web frontend backup nginx postgres redis
dc stop backup-scheduler

# Inspect the real database after starting stores. Existing volumes can outlive
# their container, so container existence alone cannot identify a fresh install.
dc up -d --no-build --wait postgres redis
# Container credentials expand inside postgres, never in the host shell.
# shellcheck disable=SC2016
schema="$(dc exec -T postgres sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$1"' sh "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" </dev/null)"
if [[ "$schema" -gt 0 ]]; then
    dc run --rm --no-deps -T --entrypoint /usr/local/bin/backup backup </dev/null
    dc run --rm --no-deps -T --entrypoint /usr/local/bin/restore backup --verify-latest </dev/null
fi

# Freeze the pulled content digest, not just a tag. Persist only image keys so
# later manual Compose commands use the same release after this shell exits.
candidate_file=".deployment/candidate-images.env"
: > "$candidate_file"
for variable in BACKEND_IMAGE FRONTEND_IMAGE BACKUP_IMAGE; do
    digest="$(docker image inspect --format '{{index .RepoDigests 0}}' "${!variable}")"
    if [[ ! "$digest" =~ @sha256:[0-9a-f]{64}$ ]]; then
        echo "Pulled image has no immutable registry digest: $variable" >&2; exit 1
    fi
    printf '%s=%s\n' "$variable" "$digest" >> "$candidate_file"
    printf -v "$variable" '%s' "$digest"
    export "${variable?}"
done
python3 infra/release_env.py --images "$candidate_file"

dc run --rm --no-deps -T web python manage.py check --deploy --fail-level WARNING </dev/null
dc up -d --no-build --wait --wait-timeout 240 web worker beat frontend nginx
# Recreate nginx after upstream containers change so DNS and mounted config refresh.
dc up -d --no-deps --force-recreate nginx
python3 infra/smoke.py --site "$DEPLOY_SITE_URL" --api "$DEPLOY_SITE_URL"
# Prove private off-host recovery also works on a fresh installation.
dc run --rm --no-deps -T --entrypoint /usr/local/bin/backup backup </dev/null
dc run --rm --no-deps -T --entrypoint /usr/local/bin/restore backup --verify-latest </dev/null
dc up -d --no-build --wait --wait-timeout 180 backup-scheduler
cp "$candidate_file" .deployment/current-images.env
printf '%s\n' "$RELEASE_SHA" > .deployment/current-sha
printf 'Deployment passed for %s\n' "$RELEASE_SHA"
