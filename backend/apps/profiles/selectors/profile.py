"""
Selectors related to the Profile model.
"""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from apps.profiles.models import Profile


def get_profile_by_user(
    *,
    user_id: UUID,
) -> Profile:
    """
    Return the profile for a user.

    Raises:
        Profile.DoesNotExist
    """
    return Profile.objects.select_related("user").get(user_id=user_id)


def find_profile_by_user(
    *,
    user_id: UUID,
) -> Profile | None:
    """
    Return the profile for a user, or None.
    """
    return Profile.objects.select_related("user").filter(user_id=user_id).first()


def get_profile_with_addresses(
    *,
    user_id: UUID,
) -> Profile:
    """
    Return the profile with the owner's addresses prefetched.

    Used by the profile detail endpoint, which renders both.

    Raises:
        Profile.DoesNotExist
    """
    return (
        Profile.objects.select_related("user")
        .prefetch_related("user__addresses")
        .get(user_id=user_id)
    )


def list_profiles() -> QuerySet[Profile]:
    """
    Return every profile.
    """
    return Profile.objects.select_related("user").order_by("-created_at")
