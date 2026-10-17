"""
Cleanup expired user sessions.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.users.models import UserSession


@transaction.atomic
def cleanup_expired_sessions() -> int:
    """
    Mark expired sessions as inactive.
    """

    expired = UserSession.objects.filter(
        token__expires_at__lt=timezone.now(),
        is_active=True,
    )

    updated = expired.update(
        is_active=False,
    )

    return updated
