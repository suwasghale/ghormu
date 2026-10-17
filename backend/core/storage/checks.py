"""
Startup checks for object storage.

Cloud storage can be fully configured and still serve nothing: R2's S3
API endpoint requires a signature on every read, so an object uploaded
to it is stored correctly and answers 400 to a browser. The bucket needs
either its r2.dev development URL enabled or a custom domain bound to
it, and that hostname set as ``R2_CUSTOM_DOMAIN``.

That failure is invisible until someone looks at the site and finds
every image broken, so it is reported here instead.
"""

from __future__ import annotations

from django.conf import settings
from django.core.checks import Warning, register


@register("storage")
def check_public_media_is_reachable(app_configs, **kwargs):
    """
    Warn when uploads would be stored somewhere nothing can read.
    """

    if not getattr(settings, "USE_CLOUD_STORAGE", False):
        return []

    if getattr(settings, "AWS_S3_CUSTOM_DOMAIN", ""):
        return []

    return [
        Warning(
            "Cloud storage is on but R2_CUSTOM_DOMAIN is empty, so uploaded "
            "media URLs point at the S3 API endpoint, which is not publicly "
            "readable. Every uploaded image will appear broken.",
            hint=(
                "In the Cloudflare dashboard open R2 > the bucket > Settings, "
                "then either enable the r2.dev public development URL or "
                "connect a custom domain. Put that hostname (no scheme) in "
                "R2_CUSTOM_DOMAIN, and add the same hostname to "
                "`images.remotePatterns` in frontend/next.config.ts — "
                "next/image refuses to fetch a host that is not listed "
                "there, so setting only one of the two leaves every image "
                "broken in a different way."
            ),
            id="storage.W001",
        ),
    ]
