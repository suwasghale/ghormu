"""
===============================================================================
Django Cache Configuration
===============================================================================

This module configures Django's caching framework using Redis.

Why Redis?
----------
- High performance
- Shared cache across multiple Django instances
- Production-ready
- Works seamlessly with Celery

References:
- https://docs.djangoproject.com/en/stable/topics/cache/
- https://github.com/jazzband/django-redis
===============================================================================
"""

from urllib.parse import quote

from config.settings.env import APP_SLUG, env, env_str

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

REDIS_CACHE_DB = env.int(
    "REDIS_CACHE_DB",
    default=1,
)


def build_redis_url(database: int) -> str:
    """
    Build a Redis connection URL.

    Example:
        redis://localhost:6379/1

        redis://:password@localhost:6379/1
    """

    if REDIS_PASSWORD:
        password = quote(REDIS_PASSWORD, safe="")
        return f"redis://:{password}@{REDIS_HOST}:{REDIS_PORT}/{database}"

    return f"redis://{REDIS_HOST}:{REDIS_PORT}/{database}"


CACHE_REDIS_URL = build_redis_url(REDIS_CACHE_DB)

# =============================================================================
# Django Cache
# =============================================================================

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": CACHE_REDIS_URL,
        "TIMEOUT": env.int(
            "CACHE_TIMEOUT",
            default=300,
        ),
        "KEY_PREFIX": env_str(
            "CACHE_KEY_PREFIX",
            default=APP_SLUG,
        ),
        "VERSION": 1,
        "OPTIONS": {
            "CLIENT_CLASS": ("django_redis.client.DefaultClient"),
            "IGNORE_EXCEPTIONS": True,
        },
    },
}

# Authentication must distinguish an unavailable cache from a missing lock.
# Share the same Redis keys, but never suppress failures for security operations.
CACHES["security"] = {
    **CACHES["default"],
    "OPTIONS": {
        **CACHES["default"]["OPTIONS"],
        "IGNORE_EXCEPTIONS": False,
        "SOCKET_CONNECT_TIMEOUT": 2,
        "SOCKET_TIMEOUT": 2,
    },
}

# =============================================================================
# Third-Party Package Settings
# =============================================================================

# Tell django-user-agents to use your default Redis cache
USER_AGENTS_CACHE = "default"
