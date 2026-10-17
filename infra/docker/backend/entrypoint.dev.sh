#!/bin/sh
# ==============================================================================
# Development entrypoint
# ==============================================================================
#
# compose already gates start-up on the Postgres healthcheck, but that only
# proves the server answers pg_isready — the role and database Django wants
# can still be mid-creation on a fresh volume. So wait for a connection
# Django itself can make, then migrate.
#
# Only the process that runs the web server migrates. The worker and beat
# containers start from the same image and would otherwise race it, so they
# set RUN_MIGRATIONS=0 in the compose file.

set -e

RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
WAIT_TIMEOUT="${DB_WAIT_TIMEOUT:-60}"

wait_for_db() {
  echo "[entrypoint] waiting for postgres at ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}"

  waited=0
  until python -c "
import sys
import django
from django.conf import settings

django.setup()
from django.db import connections

try:
    connections['default'].ensure_connection()
except Exception as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)
" 2>/dev/null; do
    waited=$((waited + 1))
    if [ "$waited" -ge "$WAIT_TIMEOUT" ]; then
      echo "[entrypoint] database not reachable after ${WAIT_TIMEOUT}s" >&2
      # Surface the real error rather than dying silently.
      python -c "
import django
django.setup()
from django.db import connections
connections['default'].ensure_connection()
"
      exit 1
    fi
    sleep 1
  done

  echo "[entrypoint] postgres is up (waited ${waited}s)"
}

wait_for_db

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "[entrypoint] applying migrations"
  python manage.py migrate --noinput
fi

exec "$@"
