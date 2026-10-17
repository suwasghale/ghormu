#!/usr/bin/env bash
# ==============================================================================
# Database backup
# ==============================================================================
#
#   ./infra/scripts/backup.sh [destination-directory]
#
# Dumps Postgres from the running production stack to a timestamped,
# gzipped custom-format file and prunes anything older than RETENTION_DAYS.
#
# Custom format (-Fc), not plain SQL: it restores with pg_restore, supports
# selective restore, and is compressed by default.
#
# Cron, daily at 03:15, keeping the log:
#
#   15 3 * * * cd /srv/ghormu && ./infra/scripts/backup.sh >> /var/log/ghormu-backup.log 2>&1
#
# A backup that has never been restored is a guess, not a backup — see
# the restore command printed at the end.

set -Eeuo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-backend/.env.production}"
DEST="${1:-${BACKUP_DIR:-./backups}}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

log() {
  printf '\033[1m[backup]\033[0m %s\n' "$*"
}

fail() {
  printf '\033[31m[backup] %s\033[0m\n' "$*" >&2
  exit 1
}

[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE not found - run from the repository root"
[ -f "$ENV_FILE" ] || fail "$ENV_FILE not found"

# Read the credentials from the same file the stack uses, so a rotated
# password can never leave the backup job authenticating with a stale one.
db_name="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
db_user="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

[ -n "$db_name" ] && [ -n "$db_user" ] || fail "POSTGRES_DB / POSTGRES_USER missing from $ENV_FILE"

container="$(docker compose -f "$COMPOSE_FILE" ps -q postgres | head -1)"
[ -n "$container" ] || fail "the postgres service is not running"

mkdir -p "$DEST"

stamp="$(date +%Y%m%d-%H%M%S)"
target="${DEST%/}/${db_name}-${stamp}.dump"

log "dumping $db_name -> $target"

# --clean --if-exists so the dump can be restored over an existing
# database without a manual drop first.
docker exec "$container" \
  pg_dump \
    --username="$db_user" \
    --dbname="$db_name" \
    --format=custom \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
  > "$target"

# pg_dump exiting non-zero still leaves a file behind, so check the size
# rather than trusting the exit code alone.
size="$(wc -c < "$target")"
[ "$size" -gt 1024 ] || fail "dump is only ${size} bytes - treating as failed: $target"

log "wrote $(du -h "$target" | cut -f1)"

# ------------------------------------------------------------------------------
# Retention
# ------------------------------------------------------------------------------

if [ "$RETENTION_DAYS" -gt 0 ]; then
  log "pruning dumps older than ${RETENTION_DAYS} days"
  find "$DEST" -maxdepth 1 -name "${db_name}-*.dump" -type f -mtime "+${RETENTION_DAYS}" -print -delete
fi

log "done"
echo
echo "Restore with:"
echo "  docker exec -i \$(docker compose -f $COMPOSE_FILE ps -q postgres) \\"
echo "    pg_restore --username=$db_user --dbname=$db_name --clean --if-exists < $target"
