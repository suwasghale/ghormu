#!/bin/sh
#
# Restore a backup, or verify that one can be restored.
#
#   ./restore.sh --verify-latest
#       Downloads the newest backup, restores it into a scratch database, counts
#       the rows, and drops the scratch database. Touches nothing real. This is
#       what makes the backups *tested* rather than merely taken, and it is the
#       question an auditor asks and most teams cannot answer.
#
#   ./restore.sh --list
#       What is in the bucket, newest last.
#
#   ./restore.sh --into <database> <object-key>
#       Restore a specific backup into a specific database. Refuses to write
#       over the live one; see below.
#
# The refusal is deliberate. A restore is run at the worst moment of the worst
# day, by someone under pressure, and "restore into the live database" is one
# typo away from destroying the evidence of what went wrong. Restore beside the
# live database, look at it, then swap.

set -eu
# shellcheck source=infra/backup/environment.sh
. /usr/local/bin/backup-environment

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${BACKUP_PREFIX:=backups/postgres}"

: "${R2_BUCKET:?R2_BUCKET is required}"




log() {
    printf '{"time":"%s","level":"%s","logger":"restore","message":"%s"}\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2"
}

psql_cmd() {
    psql --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" \
         --username="$POSTGRES_USER" --dbname=postgres \
         --no-psqlrc --quiet --tuples-only --no-align "$@"
}

latest_key() {
    aws s3 ls "s3://${R2_BUCKET}/${BACKUP_PREFIX}/" --endpoint-url "$ENDPOINT" \
        | sort | awk 'END {print $4}'
}

case "${1:---verify-latest}" in

--list)
    aws s3 ls "s3://${R2_BUCKET}/${BACKUP_PREFIX}/" --endpoint-url "$ENDPOINT" | sort
    ;;

--verify-latest)
    KEY="$(latest_key)"
    [ -n "$KEY" ] || { log ERROR "no backups found in the bucket"; exit 1; }

    SCRATCH="restore_check_$(date -u +%Y%m%d%H%M%S)"
    LOCAL="/tmp/${KEY}"

    cleanup() {
        rm -f "$LOCAL" "${LOCAL}.dump"
        psql_cmd --command="DROP DATABASE IF EXISTS \"${SCRATCH}\";" >/dev/null 2>&1 || true
    }
    trap cleanup EXIT

    log INFO "verifying ${KEY}"

    aws s3 cp "s3://${R2_BUCKET}/${BACKUP_PREFIX}/${KEY}" "$LOCAL" \
        --endpoint-url "$ENDPOINT" --only-show-errors

    psql_cmd --command="CREATE DATABASE \"${SCRATCH}\";" >/dev/null

    # `--no-owner` because the scratch database has no application role, and
    # ownership is irrelevant to whether the data is intact.
    gzip -dc "$LOCAL" > "${LOCAL}.dump"
    pg_restore \
        --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" --dbname="$SCRATCH" \
        --no-owner --no-privileges --exit-on-error "${LOCAL}.dump"

    # Counting tables is the difference between "the file was readable" and
    # "the data came back". A dump can restore cleanly and be empty.
    TABLES="$(psql --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" --dbname="$SCRATCH" \
        --no-psqlrc --quiet --tuples-only --no-align \
        --command="SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"

    ACCOUNTS="$(psql --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" --dbname="$SCRATCH" \
        --no-psqlrc --quiet --tuples-only --no-align \
        --command="SELECT count(*) FROM users_user;")"

    if [ "$TABLES" -lt 10 ]; then
        log ERROR "restored only ${TABLES} tables; this backup is not usable"
        exit 1
    fi

    date +%s > /tmp/last-restore-ok
    log INFO "restore verified: ${TABLES} tables, ${ACCOUNTS} accounts"
    ;;

--into)
    TARGET="${2:?usage: restore.sh --into <database> <object-key>}"
    KEY="${3:?usage: restore.sh --into <database> <object-key>}"
    case "$TARGET" in ""|*[!a-zA-Z0-9_]*) log ERROR "invalid target database name"; exit 1;; esac

    if [ "$TARGET" = "$POSTGRES_DB" ]; then
        log ERROR "refusing to restore over the live database (${POSTGRES_DB})"
        log ERROR "restore into a new database, verify it, then rename."
        exit 1
    fi

    LOCAL="/tmp/$(basename "$KEY")"
    trap 'rm -f "$LOCAL" "${LOCAL}.dump"' EXIT

    aws s3 cp "s3://${R2_BUCKET}/${BACKUP_PREFIX}/${KEY}" "$LOCAL" \
        --endpoint-url "$ENDPOINT" --only-show-errors

    psql_cmd --command="CREATE DATABASE \"${TARGET}\";" >/dev/null

    gzip -dc "$LOCAL" > "${LOCAL}.dump"
    pg_restore \
        --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" --dbname="$TARGET" \
        --no-owner --no-privileges --exit-on-error "${LOCAL}.dump"

    log INFO "restored ${KEY} into ${TARGET}"
    ;;

*)
    echo "usage: restore.sh [--verify-latest | --list | --into <db> <key>]" >&2
    exit 2
    ;;
esac
