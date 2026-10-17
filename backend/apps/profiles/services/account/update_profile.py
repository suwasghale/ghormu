"""
Profile update service.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.models import Profile
from apps.profiles.selectors.profile import get_profile_by_user

# Serializer field -> model field. Explicit rather than a loop over
# validated_data, so a serializer gaining a field cannot silently start
# writing to a model attribute nobody intended.
USER_FIELDS = (
    "first_name",
    "last_name",
)

PROFILE_FIELDS = (
    "gender",
    "date_of_birth",
    "nationality",
    "phone_number",
    "biography",
    "preferred_language",
    "timezone",
)


@transaction.atomic
def update_profile(
    *,
    user,
    validated_data: dict,
) -> Profile:
    """
    Update the authenticated user's name and profile.

    Both models are written in one transaction. Returns the profile,
    which is what the endpoint renders - the caller already holds the
    user.
    """

    # -------------------------------------------------------------------------
    # User fields
    # -------------------------------------------------------------------------

    user_fields = [f for f in USER_FIELDS if f in validated_data]

    if user_fields:
        for field in user_fields:
            setattr(user, field, validated_data[field])

        user.save(update_fields=[*user_fields, "updated_at"])

    # -------------------------------------------------------------------------
    # Profile fields
    # -------------------------------------------------------------------------

    profile = get_profile_by_user(user_id=user.id)

    profile_fields = [f for f in PROFILE_FIELDS if f in validated_data]

    if profile_fields:
        for field in profile_fields:
            setattr(profile, field, validated_data[field])

        profile.save(update_fields=[*profile_fields, "updated_at"])

    return profile
