"""
Service for removing trust from a device.
"""

from __future__ import annotations

from django.db import transaction

from apps.users.exceptions.permission import PermissionDenied
from apps.users.models import User, UserSession


@transaction.atomic
def untrust_device(
    *,
    user: User,
    session: UserSession,
) -> UserSession:
    """
    Remove trust from a session.
    """

    if session.user_id != user.id:
        raise PermissionDenied("You do not have permission to modify this device.")

    if not session.is_trusted:
        return session

    session.is_trusted = False

    session.save(
        update_fields=[
            "is_trusted",
        ],
    )

    return session
