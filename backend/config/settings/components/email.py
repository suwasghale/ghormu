"""
===============================================================================
Email Configuration
===============================================================================

Centralized email settings for development and production.

Features
--------
- Environment-driven configuration
- SMTP backend
- Console backend for development
- TLS / SSL support
- HTML email ready
- Celery compatible
- Future provider support (SES, SendGrid, Mailgun, Brevo)

===============================================================================
"""

from config.settings.env import APP_NAME, env, env_str

# =============================================================================
# Backend Selection
# =============================================================================

# Selected explicitly rather than derived from DEBUG. Deriving it meant a
# stray DEBUG=True in a production environment file silently redirected
# every outgoing email to stdout, with no error and no delivery.
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# =============================================================================
# SMTP Configuration
# =============================================================================

EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)

EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)

EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=30)

# =============================================================================
# Default Addresses
# =============================================================================

DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL",
    default="no-reply@example.com",
)

EMAIL_SITE_NAME = env_str(
    "EMAIL_SITE_NAME",
    default=APP_NAME,
)

SERVER_EMAIL = env(
    "SERVER_EMAIL",
    default=DEFAULT_FROM_EMAIL,
)

EMAIL_SUBJECT_PREFIX = env_str(
    "EMAIL_SUBJECT_PREFIX",
    default=f"[{APP_NAME}] ",
)

# =============================================================================
# Admin Notifications
# =============================================================================

ADMINS = [
    (
        env("ADMIN_NAME", default="Administrator"),
        env("ADMIN_EMAIL", default="admin@example.com"),
    ),
]

MANAGERS = ADMINS

# =============================================================================
# Email Behaviour
# =============================================================================

EMAIL_USE_LOCALTIME = True

EMAIL_SSL_CERTFILE = env(
    "EMAIL_SSL_CERTFILE",
    default=None,
)

EMAIL_SSL_KEYFILE = env(
    "EMAIL_SSL_KEYFILE",
    default=None,
)

# =============================================================================
# Future Provider Settings
# =============================================================================

EMAIL_PROVIDER = env(
    "EMAIL_PROVIDER",
    default="smtp",
)

# smtp
# sendgrid
# ses
# mailgun
# brevo

# =============================================================================
# Email Templates
# =============================================================================

EMAIL_TEMPLATE_DIR = "emails"

# =============================================================================
# Attachment Limits
# =============================================================================

EMAIL_MAX_ATTACHMENT_SIZE = env.int(
    "EMAIL_MAX_ATTACHMENT_SIZE",
    default=10 * 1024 * 1024,
)

# =============================================================================
# Retry Configuration (used by Celery tasks)
# =============================================================================

EMAIL_MAX_RETRIES = env.int(
    "EMAIL_MAX_RETRIES",
    default=3,
)

EMAIL_RETRY_DELAY = env.int(
    "EMAIL_RETRY_DELAY",
    default=60,
)

# NOTE: FRONTEND_URL and EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS used to
# be hardcoded here. Because base.py imports this component after
# components/auth.py, those literals overwrote the environment-driven
# values and every verification and reset link pointed at localhost in
# production. They now live solely in components/auth.py.

# =============================================================================
# Inbox Notifications
# =============================================================================

# Who is told when the public contact or sponsorship form is used.
# Comma-separated. Left empty, notifications fall back to ADMINS so a
# deployment that forgets this still tells somebody rather than silently
# telling nobody.
INBOX_NOTIFICATION_EMAILS = [
    address.strip()
    for address in env("INBOX_NOTIFICATION_EMAILS", default="").split(",")
    if address.strip()
]

# =============================================================================
# Inbox Retention
# =============================================================================
#
# What the privacy policy promises, expressed as numbers the code
# enforces. Until these existed the policy said submissions were deleted
# "once no longer useful" and nothing ever deleted one — a promise made to
# every person who used a form and kept for none of them.
#
# Three separate windows, because the three kinds of data have genuinely
# different lifetimes:

# The IP address and user agent recorded with every submission. They exist
# only to spot automated abuse, which is a question answered within days —
# so they are stripped long before the message itself is deleted, and the
# association keeps what it legitimately needs without keeping what it
# does not. This is the shortest window on purpose.
INBOX_SCRUB_PROVENANCE_AFTER_DAYS = env.int(
    "INBOX_SCRUB_PROVENANCE_AFTER_DAYS",
    default=90,
)

# Spam. Kept briefly so a false positive can be recovered from the admin,
# then gone. Nobody needs a two-year archive of what bots sent.
INBOX_PURGE_SPAM_AFTER_DAYS = env.int(
    "INBOX_PURGE_SPAM_AFTER_DAYS",
    default=30,
)

# Handled submissions. Two years covers a full association cycle and any
# question about a past sponsorship enquiry.
#
# Submissions still marked NEW are never purged, at any age. An unanswered
# sponsorship request silently disappearing is the worst thing this task
# could do, and age is not evidence that it was dealt with — only that
# nobody has looked at it.
INBOX_PURGE_HANDLED_AFTER_DAYS = env.int(
    "INBOX_PURGE_HANDLED_AFTER_DAYS",
    default=730,
)
