"""
Object storage backends.

Settings are read through properties rather than assigned at class
definition time. Class-body access runs at import, which freezes the
values before ``override_settings`` or a late-loading environment can
take effect, and forces the settings module to be fully configured
before this module can even be imported.
"""

from django.conf import settings
from storages.backends.s3 import S3Storage


class PublicMediaStorage(S3Storage):
    """
    S3-compatible storage backend for publicly accessible media.

    "Publicly accessible" depends on configuration this class cannot
    supply. R2's S3 API endpoint is *not* readable without a signature —
    fetching an object URL from it answers 400 — so a bucket serving
    public media needs either its r2.dev development URL enabled or a
    custom domain bound to it, and that value set as ``R2_CUSTOM_DOMAIN``.

    Without it every uploaded image is stored correctly and displays
    nowhere. ``core.storage.checks`` turns that into a warning at
    startup rather than a broken <img> in production.
    """

    location = "media"

    default_acl = None

    file_overwrite = False

    querystring_auth = False

    @property
    def bucket_name(self) -> str:
        return settings.AWS_STORAGE_BUCKET_NAME

    @property
    def endpoint_url(self) -> str:
        return settings.AWS_S3_ENDPOINT_URL

    @property
    def custom_domain(self) -> str | None:
        # Read through a property for the same reason as the two above:
        # class-body access freezes the value at import time.
        return settings.AWS_S3_CUSTOM_DOMAIN or None


class PrivateMediaStorage(S3Storage):
    """
    Storage backend for media that must not be publicly readable.

    Objects are served through expiring signed URLs.
    """

    location = "private"

    default_acl = "private"

    file_overwrite = False

    querystring_auth = True

    @property
    def bucket_name(self) -> str:
        return settings.AWS_STORAGE_BUCKET_NAME

    @property
    def endpoint_url(self) -> str:
        return settings.AWS_S3_ENDPOINT_URL

    @property
    def querystring_expire(self) -> int:
        return settings.AWS_QUERYSTRING_EXPIRE
