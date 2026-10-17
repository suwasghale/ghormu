"""
Service for setting a user's default address.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.models import Address
from apps.users.exceptions.permission import PermissionDenied
from apps.users.models import User


@transaction.atomic
def set_default_address(
    *,
    user: User,
    address: Address,
) -> Address:
    """
    Set an address as the user's default address.
    """

    if address.user_id != user.id:
        raise PermissionDenied("You do not have permission to modify this address.")

    (
        Address.objects.filter(
            user=user,
            is_default=True,
        )
        .exclude(
            id=address.id,
        )
        .update(
            is_default=False,
        )
    )

    if not address.is_default:
        address.is_default = True

        address.save(
            update_fields=[
                "is_default",
            ],
        )

    return address
