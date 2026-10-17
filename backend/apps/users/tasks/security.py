"""
Celery tasks for account security.
"""

from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    name="apps.users.tasks.security.cleanup_expired_sessions",
)
def cleanup_expired_sessions_task() -> int:
    """
    Mark expired sessions as inactive.

    An explicit ``name`` is set so the beat schedule keeps working if the
    function is ever renamed or moved.

    Returns:
        Number of sessions updated.
    """

    from apps.users.services.security.cleanup_sessions import (
        cleanup_expired_sessions,
    )

    updated = cleanup_expired_sessions()

    logger.info(
        "Marked %s expired session(s) inactive.",
        updated,
    )

    return updated


@shared_task(
    name="apps.users.tasks.security.log_security_event",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 3},
)
def log_security_event_task(*, payload: dict) -> None:
    """
    Persist a security audit event off the request path.

    Audit writes should never add latency to, or be able to fail, the
    request that triggered them.
    """

    from apps.users.models import SecurityEvent

    SecurityEvent.objects.create(**payload)
