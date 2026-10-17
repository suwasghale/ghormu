"""
Telling the frontend that content changed.

The site is statically rendered. That is what keeps it fast, and it means
a published edit is invisible until Next.js rebuilds the affected page.
Rather than shortening the revalidate window for everything — which
trades the whole site's performance for one editor's impatience — Django
pings Next when something actually changes.

Design notes:

* Fired from ``transaction.on_commit``. Revalidating a page for a
  transaction that then rolls back would cache the *old* content and
  look like the save was lost.
* Runs in Celery. The editor's save must not wait on, or fail because
  of, an HTTP call to another service.
* Failure is logged, not raised. A missed revalidation self-heals when
  the ISR window expires; a 500 in the admin does not.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)


def revalidate_paths(*paths: str, tags: list[str] | None = None) -> None:
    """
    Queue a revalidation for one or more frontend paths, after commit.

    Paths are locale-less (``/projects/banepa``); the frontend expands
    each into its ``/ne`` and ``/en`` variants, because only it knows
    which locales it renders.

    ``tags`` invalidate by domain instead of by URL — passing
    ``tags=["projects"]`` rebuilds every page that read project data,
    including ones nobody remembered to list here. Prefer tags; keep
    paths for the handful of routes worth naming explicitly.
    """

    if not paths and not tags:
        return

    if not getattr(settings, "FRONTEND_REVALIDATE_URL", ""):
        logger.debug(
            "revalidation skipped: FRONTEND_REVALIDATE_URL is not configured",
        )
        return

    unique_paths = sorted({path for path in paths if path})
    unique_tags = sorted({tag for tag in (tags or []) if tag})

    # Import here: this module is imported by models, and importing a
    # task module at import time drags Celery into every migration.
    from core.tasks import revalidate_frontend_paths

    transaction.on_commit(
        lambda: revalidate_frontend_paths.delay(unique_paths, unique_tags),
    )
