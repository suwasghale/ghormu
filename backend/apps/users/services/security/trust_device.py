"""
Service for trusting a device.
"""

from __future__ import annotations

from django.db import transaction

from apps.users.exceptions.permission import PermissionDenied
from apps.users.models import User, UserSession


@transaction.atomic
def trust_device(
    *,
    user: User,
    session: UserSession,
) -> UserSession:
    """
    Mark a session as trusted.
    """

    if session.user_id != user.id:
        raise PermissionDenied("You do not have permission to trust this device.")

    if session.is_trusted:
        return session

    session.is_trusted = True

    session.save(
        update_fields=[
            "is_trusted",
        ],
    )

    return session
