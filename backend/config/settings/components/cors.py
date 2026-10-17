"""
CORS configuration.

Security note
-------------
``CORS_ALLOW_ALL_ORIGINS`` combined with ``CORS_ALLOW_CREDENTIALS``
makes django-cors-headers echo back whatever ``Origin`` the caller
sent, which lets any website on the internet issue credentialed
cross-origin requests and read the responses.

Allow-all therefore defaults to off and must be opted into explicitly,
and ``prod.py`` forces it off regardless of the environment file.
"""

from config.settings.env import env, env_list

# ------------------------------------------------------------------------------
# Origins
# ------------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = env.bool(
    "CORS_ALLOW_ALL_ORIGINS",
    default=False,
)

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

CORS_ALLOWED_ORIGIN_REGEXES = env.list(
    "CORS_ALLOWED_ORIGIN_REGEXES",
    default=[],
)

CORS_ALLOW_CREDENTIALS = env.bool(
    "CORS_ALLOW_CREDENTIALS",
    default=True,
)

# ------------------------------------------------------------------------------
# CSRF
# ------------------------------------------------------------------------------

# Kept in sync with the allowed CORS origins by default. This used to be
# hardcoded to localhost here, silently overriding the environment-driven
# value set in sessions.py, which is imported earlier.
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    default=CORS_ALLOWED_ORIGINS,
)

# ------------------------------------------------------------------------------
# Headers and methods
# ------------------------------------------------------------------------------

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "accept-language",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_EXPOSE_HEADERS = [
    "Content-Disposition",
    "Retry-After",
]

CORS_PREFLIGHT_MAX_AGE = env.int(
    "CORS_PREFLIGHT_MAX_AGE",
    default=86400,
)
