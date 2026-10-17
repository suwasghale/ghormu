"""
Selectors for trusted devices.
"""

from __future__ import annotations

from apps.users.models import User, UserSession


def list_trusted_devices(
    *,
    user: User,
):
    """
    Return all trusted devices for the user.
    """

    return UserSession.objects.filter(
        user=user,
        is_trusted=True,
        is_active=True,
    ).order_by("-last_activity")
