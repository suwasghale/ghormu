"""
Services related to the authenticated user.
"""

from __future__ import annotations

from apps.users.models import User
from apps.users.selectors.user import (
    get_user_by_id,
)

# =============================================================================
# Current User
# =============================================================================


def get_current_user(
    *,
    user: User,
) -> User:
    """
    Return the authenticated user with all required
    related objects eagerly loaded.

    Args:
        user:
            Authenticated user from request.user.

    Returns:
        User
    """

    return get_user_by_id(
        user_id=user.id,
    )
