"""
Installed applications configuration.

Split applications into:
- Django applications
- Third-party applications
- Local applications
"""

# ------------------------------------------------------------------------------
# Django Apps
# ------------------------------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# ------------------------------------------------------------------------------
# Third-party Apps
# ------------------------------------------------------------------------------

THIRD_PARTY_APPS = [
    "rest_framework",
    "storages",
    "drf_spectacular",
    "django_filters",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",
    "django_user_agents",
    # Backs CELERY_BEAT_SCHEDULER (see components/celery.py). Without it
    # beat cannot import its own models and exits at startup, which is
    # silent unless someone reads the container logs — and the periodic
    # session/token cleanup never runs.
    "django_celery_beat",
]

# ------------------------------------------------------------------------------
# Local Apps
# ------------------------------------------------------------------------------

LOCAL_APPS = [
    "core",
    "apps.users",
    "apps.profiles",
    "apps.dashboard",
    "apps.public_content",
    "apps.contact",
]

# ------------------------------------------------------------------------------
# Final Installed Apps
# ------------------------------------------------------------------------------

INSTALLED_APPS = [
    *DJANGO_APPS,
    *THIRD_PARTY_APPS,
    *LOCAL_APPS,
]
