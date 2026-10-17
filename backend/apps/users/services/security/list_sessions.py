"""
Service for listing a user's active sessions.
"""

from __future__ import annotations

from django.db.models import QuerySet

from apps.users.models import User, UserSession
from apps.users.selectors.security.security import (
    list_user_sessions,
)

# =============================================================================
# Public API
# =============================================================================


def list_active_sessions(
    *,
    user: User,
) -> QuerySet[UserSession]:
    """
    Return every active session belonging to the user.
    """

    return list_user_sessions(
        user_id=user.id,
    )
