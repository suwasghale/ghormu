"""
Core Celery tasks.
"""

from __future__ import annotations

import logging

import httpx
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(
    name="core.tasks.revalidate_frontend_paths",
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    # A revalidation is worth retrying briefly and then dropping: the
    # page self-heals when its ISR window expires, so an endlessly
    # retrying task would be noise, not resilience.
    autoretry_for=(httpx.HTTPError,),
    retry_backoff=True,
)
def revalidate_frontend_paths(
    self,
    paths: list[str],
    tags: list[str] | None = None,
) -> dict:
    """
    Ask the Next.js app to rebuild the given paths.

    Returns a small summary so the result backend carries something
    useful when someone inspects a failed run.
    """

    url = getattr(settings, "FRONTEND_REVALIDATE_URL", "")
    secret = getattr(settings, "FRONTEND_REVALIDATE_SECRET", "")

    if not url:
        return {"skipped": "FRONTEND_REVALIDATE_URL not configured"}

    response = httpx.post(
        url,
        json={"paths": paths, "tags": tags or []},
        headers={
            # A shared secret, not a signature: the endpoint only
            # triggers a rebuild of paths we name, so replay is
            # harmless and the threat model is "don't let the internet
            # spin the frontend's CPU".
            "X-Revalidate-Secret": secret,
            "Content-Type": "application/json",
        },
        timeout=10.0,
    )

    response.raise_for_status()

    logger.info(
        "revalidated %s tag(s) and %s path(s)",
        len(tags or []),
        len(paths),
    )

    return {
        "revalidated": {"paths": paths, "tags": tags or []},
        "status": response.status_code,
    }
