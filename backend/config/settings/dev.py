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

# Emails land in the console instead of a real mailbox unless a backend
# is configured explicitly.
EMAIL_BACKEND = env(  # noqa: F405
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# Password validators make fixtures and manual testing tedious locally.
if env.bool("DISABLE_PASSWORD_VALIDATORS", default=False):  # noqa: F405
    AUTH_PASSWORD_VALIDATORS = []
