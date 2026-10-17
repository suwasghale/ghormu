"""
Business logic related to user profiles.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.constants import DEFAULT_AVATAR
from apps.profiles.models import Address, Profile
from apps.users.models import User


def create_profile_for_user(user: User) -> Profile:
    """
    Create a profile for the given user.

    If a profile already exists, return it.
    """

    profile, _ = Profile.objects.get_or_create(user=user)

    return profile


def erase_profile_data(user: User) -> None:
    """
    Remove the personal data this app holds for an anonymized account.

    The profile row is kept, reset to blank values, so the one-to-one
    invariant with the user still holds. Addresses are deleted outright.
    The avatar file is removed from storage after the transaction
    commits, so a rollback cannot leave a profile pointing at a file that
    no longer exists.
    """

    Address.objects.filter(user=user).delete()

    profile = Profile.objects.filter(user=user).first()

    if profile is None:
        return

    avatar = profile.avatar

    if avatar and avatar.name and avatar.name != DEFAULT_AVATAR:
        storage, name = avatar.storage, avatar.name
        transaction.on_commit(lambda: storage.delete(name))

    profile.avatar = None
    profile.gender = ""
    profile.date_of_birth = None
    profile.nationality = None
    profile.phone_number = ""
    profile.biography = ""

    profile.save(
        update_fields=[
            "avatar",
            "gender",
            "date_of_birth",
            "nationality",
            "phone_number",
            "biography",
            "updated_at",
        ],
    )
