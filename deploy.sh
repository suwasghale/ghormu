#!/bin/bash
set -euo pipefail

# Manual deployment: bash deploy.sh <tested full commit SHA>
# CI verifies that all required validation jobs published this exact release.
# Everything else (image namespace, origin, ports) comes from deploy/site.env.
RELEASE_SHA="$(printf '%s' "${1:-${RELEASE_SHA:-}}" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Usage: bash deploy.sh <validated 40-character commit SHA>" >&2
    exit 2
fi
cd "${DEPLOY_DIR:-$(dirname "$0")}"

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

dc() {
    # deploy/site.env names the site; a checkout from before it existed has
    # none, which only matters for the read-only snapshot below.
    local site=()
    [[ -f deploy/site.env ]] && site=(--env-file deploy/site.env)
    docker compose "${site[@]}" --env-file backend/.env.production -f docker-compose.prod.yml "$@"
}
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
# The release's own site identity, validated: no placeholder domain, no
# missing email. Read after the checkout, so a release that changes
# deploy/site.env is checked against its new values.
site_values="$(python3 scripts/site_config.py --strict --shell)" || exit 2
while IFS='=' read -r key value; do
    case "$key" in
        SITE_URL|IMAGE_NAMESPACE|SITE_DOMAIN|APP_SLUG) printf -v "SITE_$key" '%s' "$value" ;;
    esac
done <<< "$site_values"
# CI passes the namespace it published to; it must be the one site.env names.
if [[ -n "${IMAGE_NAMESPACE:-}" && "$IMAGE_NAMESPACE" != "$SITE_IMAGE_NAMESPACE" ]]; then
    echo "Images were published to $IMAGE_NAMESPACE but deploy/site.env names $SITE_IMAGE_NAMESPACE" >&2
    exit 2
fi
IMAGE_NAMESPACE="$SITE_IMAGE_NAMESPACE"
DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-$SITE_SITE_URL}"
if [[ "${DEPLOY_SITE_URL%/}" != "$SITE_SITE_URL" ]]; then
    echo "SITE_URL $DEPLOY_SITE_URL does not match deploy/site.env ($SITE_SITE_URL)" >&2
    exit 2
fi
export BACKEND_IMAGE="${IMAGE_NAMESPACE}-backend:${RELEASE_SHA}"
export FRONTEND_IMAGE="${IMAGE_NAMESPACE}-frontend:${RELEASE_SHA}"
export BACKUP_IMAGE="${IMAGE_NAMESPACE}-backup:${RELEASE_SHA}"
# Also checks backend/.env.production against deploy/site.env: the origin is
# compiled into the frontend, so the two must never disagree.
python3 scripts/tasks.py check-env --require-backup
dc config --quiet
dc pull web frontend backup nginx postgres redis certbot
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
# Route this site's hostnames through the shared edge that owns ports 80 and
# 443, installing, upgrading or migrating it first if needed (docs/EDGE.md).
python3 scripts/edge.py ensure </dev/null
# Issue the certificate on the first release, or add names after SITE_ALIASES
# changed; a no-op while the current one is valid.
dc run --rm --no-deps -T certbot ensure </dev/null
# Recreate nginx after upstream containers change so DNS and mounted config
# refresh, and so it starts with HTTPS now that the certificate exists.
dc up -d --no-deps --force-recreate nginx
dc --profile tls up -d --no-build --no-deps certbot
python3 infra/smoke.py --site "$DEPLOY_SITE_URL" --api "$DEPLOY_SITE_URL"
# Prove private off-host recovery also works on a fresh installation.
dc run --rm --no-deps -T --entrypoint /usr/local/bin/backup backup </dev/null
dc run --rm --no-deps -T --entrypoint /usr/local/bin/restore backup --verify-latest </dev/null
dc up -d --no-build --wait --wait-timeout 180 backup-scheduler
cp "$candidate_file" .deployment/current-images.env
printf '%s\n' "$RELEASE_SHA" > .deployment/current-sha
printf 'Deployment passed for %s\n' "$RELEASE_SHA"
