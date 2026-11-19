"""
Local development settings.

Usage:
    DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py runserver

Never used in staging or production.
"""

from .base import *  # noqa: F401, F403

DEBUG = env.bool("DEBUG", default=True)  # noqa: F405

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",  # noqa: S104 - required for Docker port publishing
    "[::1]",
    "backend",
]

# ------------------------------------------------------------------------------
# Developer conveniences
# ------------------------------------------------------------------------------

# No persistent database connections under runserver. It handles every
# request on a new thread, and each thread kept its own connection open for
# DB_CONN_MAX_AGE seconds, so a production build of the frontend, which
# fetches every page at once, left a hundred idle connections behind and
# Postgres refused the next one ("too many clients"). Django's own advice:
# do not enable persistent connections in development.
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405

# Emails land in the console instead of a real mailbox unless a backend
# is configured explicitly.
EMAIL_BACKEND = env(  # noqa: F405
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# Password validators make fixtures and manual testing tedious locally.
if env.bool("DISABLE_PASSWORD_VALIDATORS", default=False):  # noqa: F405
    AUTH_PASSWORD_VALIDATORS = []
