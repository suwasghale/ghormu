"""
===============================================================================
Storage Configuration
===============================================================================

Centralized object storage configuration.

Supports:
- Local filesystem (development)
- Cloudflare R2 (production)
- S3-compatible storage via django-storages

===============================================================================
"""

from config.settings.env import BASE_DIR, env

# =============================================================================
# Storage Backend Selection
# =============================================================================

# Cloud storage is opt-in and explicit. It previously defaulted to the
# value of DEBUG, which selected object storage in development and the
# local filesystem in production - exactly backwards.
USE_CLOUD_STORAGE = env.bool(
    "USE_CLOUD_STORAGE",
    default=False,
)

R2_ACCOUNT_ID = env("R2_ACCOUNT_ID", default="")

AWS_S3_SIGNATURE_VERSION = "s3v4"

if USE_CLOUD_STORAGE:
    DEFAULT_FILE_STORAGE_BACKEND = "core.storage.backends.PublicMediaStorage"
else:
    DEFAULT_FILE_STORAGE_BACKEND = "django.core.files.storage.FileSystemStorage"

# WhiteNoise serves static files straight from the application process,
# which removes the need for a separate static file server. The manifest
# backend fingerprints filenames so they can be cached indefinitely.
STATICFILES_STORAGE_BACKEND = env(
    "STATICFILES_STORAGE_BACKEND",
    default=("whitenoise.storage.CompressedManifestStaticFilesStorage"),
)

STORAGES = {
    "default": {
        "BACKEND": DEFAULT_FILE_STORAGE_BACKEND,
    },
    "staticfiles": {
        "BACKEND": STATICFILES_STORAGE_BACKEND,
    },
}

# =============================================================================
# Cloudflare R2 Credentials
# =============================================================================

AWS_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY", default="")

AWS_STORAGE_BUCKET_NAME = env("R2_BUCKET_NAME", default="")

AWS_S3_ENDPOINT_URL = env("R2_ENDPOINT_URL", default="")

AWS_S3_REGION_NAME = env("R2_REGION", default="auto")

AWS_S3_CUSTOM_DOMAIN = env("R2_CUSTOM_DOMAIN", default="")

# =============================================================================
# Object Parameters
# =============================================================================

AWS_DEFAULT_ACL = None

AWS_QUERYSTRING_AUTH = env.bool(
    "R2_QUERYSTRING_AUTH",
    default=False,
)

AWS_QUERYSTRING_EXPIRE = env.int(
    "R2_QUERYSTRING_EXPIRE",
    default=3600,
)

AWS_S3_FILE_OVERWRITE = False

AWS_S3_ADDRESSING_STYLE = env("R2_ADDRESSING_STYLE", default="virtual")

AWS_IS_GZIPPED = True

AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": env(
        "R2_CACHE_CONTROL",
        default="max-age=86400",
    ),
}

# =============================================================================
# File Locations
# =============================================================================

MEDIA_URL = (
    f"https://{AWS_S3_CUSTOM_DOMAIN}/"
    if USE_CLOUD_STORAGE and AWS_S3_CUSTOM_DOMAIN
    else "/media/"
)

# Absolute paths. These were previously relative strings, which resolve
# against the process working directory and therefore break whenever the
# application is started from anywhere other than the project root.
MEDIA_ROOT = BASE_DIR / "media"

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

# =============================================================================
# Upload Limits
# =============================================================================

FILE_UPLOAD_MAX_MEMORY_SIZE = env.int(
    "FILE_UPLOAD_MAX_MEMORY_SIZE",
    default=10 * 1024 * 1024,
)

DATA_UPLOAD_MAX_MEMORY_SIZE = env.int(
    "DATA_UPLOAD_MAX_MEMORY_SIZE",
    default=20 * 1024 * 1024,
)
DATA_UPLOAD_MAX_NUMBER_FIELDS = env.int(
    "DATA_UPLOAD_MAX_NUMBER_FIELDS",
    default=1000,
)

DATA_UPLOAD_MAX_NUMBER_FILES = env.int(
    "DATA_UPLOAD_MAX_NUMBER_FILES",
    default=100,
)

FILE_UPLOAD_PERMISSIONS = 0o644

FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755
