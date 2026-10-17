"""
Test settings.

Optimised for speed and isolation: no network, no broker, no real
password hashing.
"""

from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = ["*"]

# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------

# The suite runs against SQLite by default so `pytest` works on a clean
# checkout with no Postgres running. Set TEST_DATABASE=postgres in CI to
# exercise the real engine, which is what production uses.
if env("TEST_DATABASE", default="sqlite") == "sqlite":  # noqa: F405
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
            # The Postgres-specific statement_timeout option in
            # components/database.py is not understood by SQLite.
            "OPTIONS": {},
            "TEST": {
                "NAME": ":memory:",
            },
        },
    }
else:
    DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405

# ------------------------------------------------------------------------------
# Hashing
# ------------------------------------------------------------------------------

# PBKDF2 with production iteration counts dominates the runtime of any
# suite that creates users. MD5 is obviously unsuitable anywhere else.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ------------------------------------------------------------------------------
# Cache
# ------------------------------------------------------------------------------

# Local-memory rather than Redis so the suite needs no running services.
# Each test process gets its own isolated instance.
CACHES = {
    "default": {
        "BACKEND": ("django.core.cache.backends.locmem.LocMemCache"),
        "LOCATION": "test",
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ------------------------------------------------------------------------------
# Celery
# ------------------------------------------------------------------------------

# Tasks execute inline, so `.delay()` runs synchronously and raises
# rather than silently queueing against a broker that is not there.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# ------------------------------------------------------------------------------
# Email
# ------------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# ------------------------------------------------------------------------------
# Storage
# ------------------------------------------------------------------------------

USE_CLOUD_STORAGE = False

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.InMemoryStorage",
    },
    "staticfiles": {
        "BACKEND": ("django.contrib.staticfiles.storage.StaticFilesStorage"),
    },
}

# ------------------------------------------------------------------------------
# Throttling
# ------------------------------------------------------------------------------

# Off by default so unrelated tests are not tripped by rate limits.
# Throttling tests re-enable it explicitly with override_settings.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_CLASSES": (),
    "DEFAULT_THROTTLE_RATES": dict.fromkeys(
        REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],  # noqa: F405
    ),
}

# ------------------------------------------------------------------------------
# Middleware
# ------------------------------------------------------------------------------

# WhiteNoise scans STATIC_ROOT at startup, which does not exist until
# collectstatic has run and is irrelevant to the API tests.
MIDDLEWARE = [  # noqa: F405
    entry
    for entry in MIDDLEWARE  # noqa: F405
    if "whitenoise" not in entry
]

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------

LOGGING_CONFIG = None
