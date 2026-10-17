"""
Environment configuration.

Responsibilities:
- Define project paths.
- Load the active `.env` file exactly once.
- Expose the shared `env` object.
- Prevent every settings component from loading `.env` repeatedly.

Resolution order for the env file:

1. ``DJANGO_ENV_FILE``, an explicit absolute or relative path.
2. A file matching the active settings module: `config.settings.prod`
   looks for `.env.production`, `.env.prod` then `.env`.
3. `.env`.

A missing file is not an error. Containerised deployments inject
configuration as real environment variables and ship no file at all;
values already present in the environment always win over the file.
"""

import os
from pathlib import Path

import environ

# ------------------------------------------------------------------------------
# Project Paths
# ------------------------------------------------------------------------------

# backend/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent

# Alias used by Django settings
BASE_DIR = ROOT_DIR

# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------

env = environ.Env()


def _candidate_env_files() -> list[Path]:
    """
    Return the env files to try, most specific first.
    """

    explicit = os.environ.get("DJANGO_ENV_FILE")

    if explicit:
        return [Path(explicit)]

    settings_module = os.environ.get(
        "DJANGO_SETTINGS_MODULE",
        "",
    )

    # The suffix of the settings module, e.g. "prod" for
    # "config.settings.prod". Matched exactly rather than with a
    # substring test: the old `"prod" in module` check also matched any
    # project path containing the word.
    suffix = settings_module.rsplit(".", 1)[-1]

    per_environment = {
        "prod": [".env.production", ".env.prod"],
        "production": [".env.production", ".env.prod"],
        "test": [".env.test"],
        "dev": [".env.development", ".env"],
        "development": [".env.development", ".env"],
    }

    names = per_environment.get(suffix, []) + [".env"]

    return [ROOT_DIR / name for name in names]


def _load_env() -> Path | None:
    """
    Read the first env file that exists.

    Returns:
        The file that was loaded, or None when configuration comes
        entirely from real environment variables.
    """

    for candidate in _candidate_env_files():
        if candidate.is_file():
            # overwrite=False: a real environment variable beats the
            # file, so a container can override any single setting
            # without editing the image.
            env.read_env(candidate, overwrite=False)
            return candidate

    return None


ENV_FILE = _load_env()


# ------------------------------------------------------------------------------
# Blank-tolerant lookups
# ------------------------------------------------------------------------------
#
# django-environ treats an empty value as *set*, so `KEY=` in a .env
# file overrides the default with "" rather than falling back. Every
# setting documented as "leave blank to use the default" therefore did
# the opposite: copying .env.example to .env produced an empty
# CSRF_TRUSTED_ORIGINS, an empty session cookie name and an empty
# email site name.
#
# These helpers treat blank as absent, which is what the file says and
# what anyone filling it in would expect.


def env_str(key: str, *, default: str) -> str:
    """
    Return a string setting, falling back when blank or unset.
    """

    return (env(key, default="") or "").strip() or default


def env_list(key: str, *, default: list[str]) -> list[str]:
    """
    Return a list setting, falling back when blank or unset.
    """

    raw = (env(key, default="") or "").strip()

    if not raw:
        return default

    return [item.strip() for item in raw.split(",") if item.strip()]


# ------------------------------------------------------------------------------
# Project identity
# ------------------------------------------------------------------------------

# Everything user-visible or namespace-like derives from these, so
# forking this template for a new project means changing two values
# rather than hunting a name through settings, cookies, cache keys,
# email subjects and templates.

# Display name: appears in emails, the OpenAPI document and the admin.
APP_NAME = env("APP_NAME", default="Backend")

# Machine name: used for cache key prefixes, the session cookie and the
# Celery application. Keep it lowercase and free of separators that are
# awkward in a cookie name.
APP_SLUG = env("APP_SLUG", default="app")

# Optional strapline shown under the name in email headers.
APP_TAGLINE = env("APP_TAGLINE", default="")
