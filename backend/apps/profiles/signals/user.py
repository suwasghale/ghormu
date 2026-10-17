"""
Profile lifecycle, driven by the user model.

This receiver lives in the profiles app, not in users. The dependency
must point this way: profiles knows about users, users knows nothing
about profiles. That is what lets the auth app be reused - or this app
deleted - without either breaking.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.profiles.services.profile import (
    create_profile_for_user,
    erase_profile_data,
)
from apps.users.signals import account_anonymized

User = get_user_model()


@receiver(
    post_save,
    sender=User,
    dispatch_uid="profiles.create_profile_for_new_user",
)
def handle_user_created(
    sender: type[User],
    instance,
    created: bool,
    **kwargs,
) -> None:
    """
    Create a profile when a new user is created.
    """

    if not created:
        return

    create_profile_for_user(instance)


@receiver(
    account_anonymized,
    dispatch_uid="profiles.erase_profile_data_for_anonymized_user",
)
def handle_account_anonymized(sender, user, **kwargs) -> None:
    """
    Erase profile data when a deleted account is anonymized.
    """

    erase_profile_data(user)


# NOTE: a second receiver used to fire on every non-create save and call
# `update_profile_for_user`, which did a get_or_create followed by a
# save() purely to bump `Profile.updated_at`.
#
# That put two to three extra queries on every single User write - the
# `last_login` update on each sign-in, every `last_seen` refresh, every
# profile edit - to maintain a timestamp nothing reads.
#
# If profile-side reactions to user changes are needed later, add a
# receiver that inspects `update_fields` and returns early unless a
# field it actually cares about is present.
