"""
Authentication policy configuration.

Single source of truth for token lifetimes, frontend callback URLs and
account protection thresholds.
"""

from datetime import timedelta

from config.settings.env import env, env_str

# ------------------------------------------------------------------------------
# One-time token lifetimes
# ------------------------------------------------------------------------------

EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS = env.int(
    "EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS",
    default=24,
)

EMAIL_VERIFICATION_TOKEN_LIFETIME = timedelta(
    hours=EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS,
)

PASSWORD_RESET_TOKEN_LIFETIME_MINUTES = env.int(
    "PASSWORD_RESET_TOKEN_LIFETIME_MINUTES",
    default=30,
)

PASSWORD_RESET_TOKEN_LIFETIME = timedelta(
    minutes=PASSWORD_RESET_TOKEN_LIFETIME_MINUTES,
)

EMAIL_CHANGE_TOKEN_LIFETIME = timedelta(
    hours=env.int(
        "EMAIL_CHANGE_TOKEN_LIFETIME_HOURS",
        default=24,
    ),
)

# ------------------------------------------------------------------------------
# Frontend callback URLs
# ------------------------------------------------------------------------------

FRONTEND_URL = env_str(
    "FRONTEND_URL",
    default="http://localhost:3000",
).rstrip("/")

FRONTEND_EMAIL_VERIFICATION_URL = env_str(
    "FRONTEND_EMAIL_VERIFICATION_URL",
    default=f"{FRONTEND_URL}/verify-email",
)

FRONTEND_PASSWORD_RESET_URL = env_str(
    "FRONTEND_PASSWORD_RESET_URL",
    default=f"{FRONTEND_URL}/reset-password",
)

FRONTEND_EMAIL_CHANGE_URL = env_str(
    "FRONTEND_EMAIL_CHANGE_URL",
    default=f"{FRONTEND_URL}/change-email",
)

# ------------------------------------------------------------------------------
# Account protection
# ------------------------------------------------------------------------------

# Per-account login throttling. IP-based throttling alone is trivially
# bypassed by a distributed attacker, so failed attempts are also counted
# against the target account.
LOGIN_MAX_FAILED_ATTEMPTS = env.int(
    "LOGIN_MAX_FAILED_ATTEMPTS",
    default=10,
)

LOGIN_FAILURE_WINDOW_SECONDS = env.int(
    "LOGIN_FAILURE_WINDOW_SECONDS",
    default=900,
)

LOGIN_LOCKOUT_SECONDS = env.int(
    "LOGIN_LOCKOUT_SECONDS",
    default=900,
)

# When true, changing or resetting a password revokes every existing
# session. Leaving a stolen token alive after a password reset defeats
# the purpose of the reset.
REVOKE_SESSIONS_ON_PASSWORD_CHANGE = env.bool(
    "REVOKE_SESSIONS_ON_PASSWORD_CHANGE",
    default=True,
)

# Reject access tokens that carry no session claim. Every token this
# application issues is bound to a session; a token without one cannot
# be checked against the revocation list.
JWT_REQUIRE_SESSION_CLAIM = env.bool(
    "JWT_REQUIRE_SESSION_CLAIM",
    default=True,
)

# ------------------------------------------------------------------------------
# Proxy awareness
# ------------------------------------------------------------------------------

# Number of reverse proxies in front of the application. Zero means
# X-Forwarded-For is ignored entirely, which is the safe default for a
# directly exposed service. See core/security/request_meta.py.
TRUSTED_PROXY_COUNT = env.int(
    "TRUSTED_PROXY_COUNT",
    default=0,
)

# ------------------------------------------------------------------------------
# Authentication backends
# ------------------------------------------------------------------------------

# Wraps Django's ModelBackend with the same per-account lockout the API
# login uses. Without it `/admin/login/` - and every other caller of
# django.contrib.auth.authenticate() - has no brute-force protection at
# all, while the API endpoint next to it is limited to ten attempts.
AUTHENTICATION_BACKENDS = [
    "apps.users.auth_backends.LockoutModelBackend",
]


# ------------------------------------------------------------------------------
# Multi-factor authentication
# ------------------------------------------------------------------------------

# How long a login may sit half-completed, waiting for a code. It
# represents a password that has already been accepted, so it should not
# outlive the user's attention.
MFA_CHALLENGE_TTL_SECONDS = env.int(
    "MFA_CHALLENGE_TTL_SECONDS",
    default=300,
)

# ------------------------------------------------------------------------------
# Account deletion
# ------------------------------------------------------------------------------

# Deleted accounts keep their personal data this long, so a mistaken or
# malicious deletion can still be reversed by an administrator. After
# that a daily task anonymizes them. See
# apps/users/services/auth/anonymize_account.py.
ACCOUNT_DELETION_GRACE_DAYS = env.int(
    "ACCOUNT_DELETION_GRACE_DAYS",
    default=30,
)

# ------------------------------------------------------------------------------
# Social sign-in
# ------------------------------------------------------------------------------

# Google is registered when both values are set, and a system check
# fails startup when only one is. See
# apps/users/services/auth/social/google.py.
GOOGLE_OAUTH_CLIENT_ID = env(
    "GOOGLE_OAUTH_CLIENT_ID",
    default="",
)

GOOGLE_OAUTH_CLIENT_SECRET = env(
    "GOOGLE_OAUTH_CLIENT_SECRET",
    default="",
)
