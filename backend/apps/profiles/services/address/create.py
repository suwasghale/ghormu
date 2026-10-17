"""
Service for creating a user address.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.models import Address
from apps.profiles.services.address.set_default import (
    set_default_address,
)
from apps.users.models import User


@transaction.atomic
def create_address(
    *,
    user: User,
    **data,
) -> Address:
    """
    Create a new address for the user.
    """

    make_default = data.pop(
        "is_default",
        False,
    )

    address = Address.objects.create(
        user=user,
        **data,
    )

    has_default = Address.objects.filter(
        user=user,
        is_default=True,
    ).exists()

    if make_default or not has_default:
        address = set_default_address(
            user=user,
            address=address,
        )

    return address
