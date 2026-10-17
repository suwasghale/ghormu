"""
===============================================================================
Celery Configuration
===============================================================================

This module contains all Celery-related settings.

Celery uses Redis as:

- Message Broker
- Result Backend

===============================================================================
"""

from celery.schedules import crontab

from config.settings.env import env

# =============================================================================
# Redis Connection
# =============================================================================

REDIS_HOST = env(
    "REDIS_HOST",
    default="redis",
)

REDIS_PORT = env.int(
    "REDIS_PORT",
    default=6379,
)

REDIS_PASSWORD = env(
    "REDIS_PASSWORD",
    default="",
)

REDIS_CELERY_DB = env.int(
    "REDIS_CELERY_DB",
    default=0,
)


def build_redis_url(database: int) -> str:
    """
    Build Redis URL for Celery.
    """

    if REDIS_PASSWORD:
        from urllib.parse import quote

        password = quote(REDIS_PASSWORD, safe="")
        return f"redis://:{password}@{REDIS_HOST}:{REDIS_PORT}/{database}"

    return f"redis://{REDIS_HOST}:{REDIS_PORT}/{database}"


CELERY_REDIS_URL = build_redis_url(REDIS_CELERY_DB)

# =============================================================================
# Broker
# =============================================================================

CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL",
    default=CELERY_REDIS_URL,
)

CELERY_RESULT_BACKEND = env(
    "CELERY_RESULT_BACKEND",
    default=CELERY_REDIS_URL,
)

# =============================================================================
# Serialization
# =============================================================================

CELERY_ACCEPT_CONTENT = [
    "json",
]

CELERY_TASK_SERIALIZER = "json"

CELERY_RESULT_SERIALIZER = "json"

# =============================================================================
# Time
# =============================================================================

CELERY_ENABLE_UTC = True

CELERY_TIMEZONE = "UTC"

# =============================================================================
# Task Behaviour
# =============================================================================

CELERY_TASK_TRACK_STARTED = True

CELERY_TASK_IGNORE_RESULT = False

CELERY_TASK_ACKS_LATE = True

CELERY_TASK_REJECT_ON_WORKER_LOST = True

CELERY_WORKER_PREFETCH_MULTIPLIER = 1

# =============================================================================
# Limits
# =============================================================================

CELERY_TASK_SOFT_TIME_LIMIT = env.int(
    "CELERY_TASK_SOFT_TIME_LIMIT",
    default=1500,
)

CELERY_TASK_TIME_LIMIT = env.int(
    "CELERY_TASK_TIME_LIMIT",
    default=1800,
)

CELERY_RESULT_EXPIRES = env.int(
    "CELERY_RESULT_EXPIRES",
    default=3600,
)

# =============================================================================
# Workers
# =============================================================================

CELERY_WORKER_CONCURRENCY = env.int(
    "CELERY_WORKER_CONCURRENCY",
    default=4,
)

CELERY_WORKER_MAX_TASKS_PER_CHILD = env.int(
    "CELERY_MAX_TASKS_PER_CHILD",
    default=100,
)

CELERY_WORKER_MAX_MEMORY_PER_CHILD = env.int(
    "CELERY_MAX_MEMORY_PER_CHILD",
    default=256000,
)

CELERY_BEAT_SCHEDULE = {
    "cleanup-expired-sessions": {
        "task": "apps.users.tasks.security.cleanup_expired_sessions",
        "schedule": crontab(hour=3, minute=0),
    },
    "flush-expired-jwt-blacklist": {
        # OutstandingToken grows by one row per login forever. Simple JWT
        # ships a command to drop rows whose refresh token has expired
        # and can therefore never be presented again.
        "task": "apps.users.tasks.maintenance.flush_expired_tokens",
        "schedule": crontab(hour=3, minute=30),
    },
    "anonymize-deleted-accounts": {
        # Soft-deleted accounts keep their personal data only for
        # ACCOUNT_DELETION_GRACE_DAYS.
        "task": "apps.users.tasks.maintenance.anonymize_deleted_accounts",
        "schedule": crontab(hour=4, minute=0),
    },
}

# Reject tasks whose name is not registered rather than silently
# dropping them, so a typo in the schedule surfaces immediately.
CELERY_TASK_REMOTE_TRACEBACKS = True

# Connection resilience: without this the worker exits if the broker is
# unavailable at startup, which turns a transient Redis blip into a
# manual restart.
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

CELERY_BROKER_TRANSPORT_OPTIONS = {
    "visibility_timeout": CELERY_TASK_TIME_LIMIT + 60,
}
# =============================================================================
# Beat
# =============================================================================

CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers.DatabaseScheduler"

# =============================================================================
# Frontend revalidation
# =============================================================================
#
# Where to tell Next.js that content changed. Empty disables the ping
# entirely, which is the right default for tests and for a backend
# deployed without the site in front of it.

FRONTEND_REVALIDATE_URL = env(
    "FRONTEND_REVALIDATE_URL",
    default="",
)

FRONTEND_REVALIDATE_SECRET = env(
    "FRONTEND_REVALIDATE_SECRET",
    default="",
)
