"""
Middleware configuration.

Order matters. Security first, then CORS (which must be able to answer
preflight requests before anything else short-circuits them), then the
session/auth stack.

Session activity tracking deliberately lives in the authentication class
rather than in middleware: `request.auth` is populated by DRF during
view dispatch, so a middleware cannot see the JWT at all.
"""

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_user_agents.middleware.UserAgentMiddleware",
]
