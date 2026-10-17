"""
Selectors related to account security.
"""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from apps.users.models import UserSession

# =============================================================================
# Sessions
# =============================================================================


def list_user_sessions(
    *,
    user_id: UUID,
) -> QuerySet[UserSession]:
    """
    Return all active user sessions.
    """
    return (
        UserSession.objects.filter(
            user_id=user_id,
            is_active=True,
        )
        .select_related("token")
        .order_by("-last_activity")
    )
