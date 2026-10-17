#!/bin/sh
#
# Nightly off-host database backup.
#
# Runs in the postgres:17-alpine image so pg_dump matches the server exactly.
# That is not fussiness: pg_dump refuses to dump a server newer than itself, so
# a backup job built on the application image (Debian slim, which ships an
# older client) fails the first night after a Postgres upgrade -- and a backup
# job that has silently stopped is worse than none, because you believe you
# have backups.
#
# Off-host is the whole point. `postgres_data` is a Docker volume on the same
# VPS as everything else: it survives a container being recreated and does not
# survive the disk, the droplet being deleted, or `docker volume prune` typed
# in the wrong window. So the dump goes straight to a private backup bucket separate from public media.
#
# Failure is loud. `set -e` plus an explicit trap means a failed dump or a
# failed upload exits non-zero, the container reports unhealthy, and the run is
# visible. The classic backup failure is a job that has been erroring nightly
# for eight months into a log nobody reads.
#
# Restore: infra/backup/restore.sh, and read it before you need it.

set -eu
# shellcheck source=infra/backup/environment.sh
. /usr/local/bin/backup-environment

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${BACKUP_RETENTION_DAYS:=30}"
: "${BACKUP_PREFIX:=backups/postgres}"

: "${R2_BUCKET:?R2_BUCKET is required}"

: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"


STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
NAME="${POSTGRES_DB}-${STAMP}.dump.gz"
LOCAL="/tmp/${NAME}"

log() {
    # One JSON object per line, matching the application's log format so both
    # can be filtered the same way.
    printf '{"time":"%s","level":"%s","logger":"backup","message":"%s"}\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2"
}

cleanup() {
    rm -f "$LOCAL" "${LOCAL}.raw" "${LOCAL}.objects" "${LOCAL}.expired"
}
trap cleanup EXIT

log INFO "starting backup of ${POSTGRES_DB}"

# --format=custom, not plain SQL. It compresses, it can be restored
# selectively, and pg_restore can list its contents -- which is what makes the
# verification below possible at all.
pg_dump \
    --host="$POSTGRES_HOST" \
    --port="$POSTGRES_PORT" \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file="${LOCAL}.raw"
gzip -9 < "${LOCAL}.raw" > "$LOCAL"
rm -f "${LOCAL}.raw"

SIZE="$(wc -c < "$LOCAL" | tr -d ' ')"

# A dump of an empty or unreachable database still produces a small, valid
# file. Uploading it would quietly replace a good backup set with useless ones,
# so anything implausibly small is treated as a failure.
if [ "$SIZE" -lt 5000 ]; then
    log ERROR "dump is only ${SIZE} bytes; refusing to upload"
    exit 1
fi

# Verify before uploading, not after. A corrupt dump that reached the bucket is
# a backup you will trust until the day you need it.
if ! gzip -t "$LOCAL"; then
    log ERROR "dump failed its gzip integrity check"
    exit 1
fi

if ! gzip -dc "$LOCAL" | pg_restore --list > /dev/null 2>&1; then
    log ERROR "pg_restore cannot read the dump"
    exit 1
fi

log INFO "dump verified (${SIZE} bytes)"

aws s3 cp "$LOCAL" "s3://${R2_BUCKET}/${BACKUP_PREFIX}/${NAME}" \
    --endpoint-url "$ENDPOINT" \
    --only-show-errors

log INFO "uploaded ${BACKUP_PREFIX}/${NAME}"

# ------------------------------------------------------------------------------
# Retention
#
# Deleted only after a successful upload, so a bad night never removes the
# backups that are still good.
# ------------------------------------------------------------------------------

case "$BACKUP_RETENTION_DAYS" in ""|*[!0-9]*) log ERROR "invalid retention days"; exit 1;; esac
[ "$BACKUP_RETENTION_DAYS" -ge 1 ] || { log ERROR "retention must be positive"; exit 1; }
CUTOFF="$(date -u -d "@$(( $(date +%s) - BACKUP_RETENTION_DAYS * 86400 ))" +%Y-%m-%d)"

# Capture each command's status: a pipeline could hide a failed bucket listing.
aws s3 ls "s3://${R2_BUCKET}/${BACKUP_PREFIX}/" --endpoint-url "$ENDPOINT" > "${LOCAL}.objects"
awk -v cutoff="$CUTOFF" '$1 < cutoff {print $4}' "${LOCAL}.objects" > "${LOCAL}.expired"
while IFS= read -r key; do
    [ -n "$key" ] || continue
    aws s3 rm "s3://${R2_BUCKET}/${BACKUP_PREFIX}/${key}" \
        --endpoint-url "$ENDPOINT" --only-show-errors
    log INFO "pruned ${key}"
done < "${LOCAL}.expired"

date +%s > /tmp/last-backup-ok
log INFO "backup complete"
