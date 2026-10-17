"""
Account avatar update service.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.constants import (
    AVATAR_OUTPUT_FORMAT,
    AVATAR_OUTPUT_QUALITY,
    AVATAR_OUTPUT_SIZE,
    DEFAULT_AVATAR,
)
from apps.profiles.selectors.profile import get_profile_by_user
from apps.users.exceptions.account import InvalidAvatar
from apps.users.models import User
from core.storage.images import InvalidImage, process_image

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def update_avatar(
    *,
    user: User,
    avatar,
) -> User:
    """
    Update the authenticated user's avatar.

    Workflow

        1. Load profile.
        2. Process and validate the uploaded image.
        3. Delete the previous avatar.
        4. Store the new one.

    Processing happens before the old avatar is removed. The previous
    order deleted first, so a rejected upload left the user with no
    avatar at all and nothing to roll back to - the file is gone from
    object storage even though the database transaction unwinds.

    Raises:
        InvalidAvatar
    """

    profile = get_profile_by_user(user_id=user.id)

    # -------------------------------------------------------------------------
    # Process image
    # -------------------------------------------------------------------------

    try:
        processed_image = process_image(
            image_file=avatar,
            size=AVATAR_OUTPUT_SIZE,
            quality=AVATAR_OUTPUT_QUALITY,
            output_format=AVATAR_OUTPUT_FORMAT,
        )

    except InvalidImage as exc:
        raise InvalidAvatar(str(exc)) from exc

    # -------------------------------------------------------------------------
    # Remove previous avatar
    # -------------------------------------------------------------------------

    if profile.avatar and profile.avatar.name and profile.avatar.name != DEFAULT_AVATAR:
        profile.avatar.delete(save=False)

    # -------------------------------------------------------------------------
    # Store
    # -------------------------------------------------------------------------

    filename = f"{user.id}/avatar.webp"

    profile.avatar.save(
        filename,
        processed_image,
        save=False,
    )

    profile.save(
        update_fields=[
            "avatar",
            "updated_at",
        ],
    )

    return user
