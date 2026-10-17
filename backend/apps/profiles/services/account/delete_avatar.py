"""
Account avatar deletion service.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.constants import (
    DEFAULT_AVATAR,
)
from apps.profiles.selectors.profile import (
    get_profile_by_user,
)
from apps.users.models import User

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def delete_avatar(
    *,
    user: User,
) -> User:
    """
    Delete the authenticated user's avatar.

    Workflow
    --------
        1. Load profile.
        2. Remove avatar from Cloudflare R2.
        3. Reset avatar field.
        4. Save profile.
        5. Return updated user.

    Parameters
    ----------
    user:
        Authenticated user.

    Returns
    -------
    User
        Updated user instance.
    """

    profile = get_profile_by_user(user_id=user.id)

    # -------------------------------------------------------------------------
    # Nothing to delete
    # -------------------------------------------------------------------------

    if not profile.avatar:
        return user

    # -------------------------------------------------------------------------
    # Don't delete shared default avatar
    # -------------------------------------------------------------------------

    if profile.avatar.name and profile.avatar.name != DEFAULT_AVATAR:
        profile.avatar.delete(
            save=False,
        )

    # -------------------------------------------------------------------------
    # Reset field
    # -------------------------------------------------------------------------

    profile.avatar = None

    profile.save(
        update_fields=[
            "avatar",
        ],
    )

    return user
