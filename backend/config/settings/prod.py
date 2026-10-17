"""
Production settings.

Anything security relevant is forced here rather than read from the
environment, so a misconfigured .env file cannot silently weaken a
production deployment.
"""

from .base import *  # noqa: F401, F403

DEBUG = False

# ------------------------------------------------------------------------------
# Hosts
# ------------------------------------------------------------------------------

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")  # noqa: F405

if not ALLOWED_HOSTS:
    raise RuntimeError(
        "ALLOWED_HOSTS must be set in production.",
    )

# ------------------------------------------------------------------------------
# Transport security
# ------------------------------------------------------------------------------

SECURE_SSL_REDIRECT = True
# Only dependency-free/status probes may use the private container's plain HTTP.
SECURE_REDIRECT_EXEMPT = [r"^health/(?:ready/)?$"]

SESSION_COOKIE_SECURE = True

CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000

SECURE_HSTS_INCLUDE_SUBDOMAINS = True

SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True

SECURE_REFERRER_POLICY = "same-origin"

SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SAMESITE = "Lax"

# Behind a TLS-terminating proxy Django only sees plain HTTP, so
# SECURE_SSL_REDIRECT would redirect forever without this header telling
# it the original request was already secure.
if env.int("TRUSTED_PROXY_COUNT", default=0) > 0:  # noqa: F405
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ------------------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------------------

# Forced off. Combined with CORS_ALLOW_CREDENTIALS this would let any
# origin on the internet issue credentialed requests and read the
# responses.
CORS_ALLOW_ALL_ORIGINS = False

if not CORS_ALLOWED_ORIGINS and not CORS_ALLOWED_ORIGIN_REGEXES:  # noqa: F405
    raise RuntimeError(
        "CORS_ALLOWED_ORIGINS must be set in production.",
    )

# ------------------------------------------------------------------------------
# API surface
# ------------------------------------------------------------------------------

# The browsable API renders a writable HTML UI for every endpoint.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ("core.api.renderers.ORJSONRenderer",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.users.authentication.SessionAwareJWTAuthentication",
    ),
}

# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------

DATABASES["default"]["CONN_MAX_AGE"] = env.int(  # noqa: F405
    "DB_CONN_MAX_AGE",
    default=60,
)

DATABASES["default"]["CONN_HEALTH_CHECKS"] = True  # noqa: F405

DATABASES["default"].setdefault("OPTIONS", {})  # noqa: F405
DATABASES["default"]["OPTIONS"]["sslmode"] = env(  # noqa: F405
    "DB_SSLMODE",
    default="require",
)

# ------------------------------------------------------------------------------
# Startup validation
# ------------------------------------------------------------------------------

if SECRET_KEY == JWT_SIGNING_KEY:  # noqa: F405
    import warnings

    warnings.warn(
        "JWT_SIGNING_KEY falls back to SECRET_KEY. Set a dedicated "
        "signing key so JWTs can be rotated independently of session "
        "and CSRF signing.",
        stacklevel=1,
    )
