"""
Service for recording security activities.

Audit writes are dispatched to Celery so they add no latency to the
request that triggered them and cannot fail it. If the broker is
unreachable the write falls back to running inline: losing an audit
record is worse than a slow request.
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction

from apps.users.choices import (
    DeviceTypeChoices,
    SecurityEventStatusChoices,
)
from apps.users.models import User, UserSession
from core.security.request_meta import get_client_ip, get_user_agent

logger = logging.getLogger(__name__)


# =============================================================================
# Public API
# =============================================================================


def log_security_activity(
    *,
    user: User,
    event_type: str,
    session: UserSession | None = None,
    request=None,
    status: str = SecurityEventStatusChoices.SUCCESS,
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Record a security audit event.

    Device information is taken from the session when one exists, since
    that is what the user sees in their session list, and from the
    request otherwise.
    """

    payload = _build_payload(
        user=user,
        event_type=event_type,
        session=session,
        request=request,
        status=status,
        metadata=metadata,
    )

    transaction.on_commit(
        lambda: _dispatch(payload),
    )


# =============================================================================
# Internal
# =============================================================================


def _dispatch(payload: dict[str, Any]) -> None:
    from apps.users.models import SecurityEvent
    from apps.users.tasks.security import log_security_event_task

    try:
        log_security_event_task.delay(payload=payload)

    except Exception:
        # Broker unavailable. An audit record is worth more than the few
        # milliseconds this costs, so write it synchronously instead.
        logger.warning(
            "Could not queue security event; writing inline.",
            exc_info=True,
        )

        SecurityEvent.objects.create(**payload)


def _build_payload(
    *,
    user: User,
    event_type: str,
    session: UserSession | None,
    request,
    status: str,
    metadata: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Build a JSON-serialisable payload for the audit task.

    Only primitives are included: the payload crosses a Celery queue and
    model instances cannot be serialised into it.
    """

    if session is not None:
        return {
            "user_id": str(user.pk),
            "session_id": str(session.pk),
            "event_type": event_type,
            "status": status,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "device_name": session.device_name,
            "device_type": session.device_type,
            "browser": session.browser,
            "browser_version": session.browser_version,
            "operating_system": session.operating_system,
            "operating_system_version": (session.operating_system_version),
            "country": (str(session.country) if session.country else None),
            "city": session.city,
            "metadata": metadata or {},
        }

    return {
        "user_id": str(user.pk),
        "session_id": None,
        "event_type": event_type,
        "status": status,
        "ip_address": (get_client_ip(request) if request is not None else None),
        "user_agent": (get_user_agent(request) if request is not None else ""),
        "device_name": "",
        "device_type": DeviceTypeChoices.UNKNOWN,
        "browser": "",
        "browser_version": "",
        "operating_system": "",
        "operating_system_version": "",
        "country": None,
        "city": "",
        "metadata": metadata or {},
    }
