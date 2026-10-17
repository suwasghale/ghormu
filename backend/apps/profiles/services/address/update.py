"""
Service for updating a user's address.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.exceptions import (
    DuplicateAddressType,
)
from apps.profiles.models import Address
from apps.profiles.services.address.set_default import (
    set_default_address,
)
from apps.users.exceptions.permission import PermissionDenied
from apps.users.models import User


@transaction.atomic
def update_address(
    *,
    user: User,
    address: Address,
    **data,
) -> Address:
    """
    Update a user's address.
    """

    # -------------------------------------------------------------------------
    # Ownership
    # -------------------------------------------------------------------------

    if address.user_id != user.id:
        raise PermissionDenied("You do not have permission to modify this address.")

    # -------------------------------------------------------------------------
    # Prevent duplicate address types
    # -------------------------------------------------------------------------

    new_address_type = data.get(
        "address_type",
        address.address_type,
    )

    if (
        new_address_type != address.address_type
        and Address.objects.filter(
            user=user,
            address_type=new_address_type,
        )
        .exclude(pk=address.pk)
        .exists()
    ):
        address_type_display = Address(
            address_type=new_address_type,
        ).get_address_type_display()

        raise DuplicateAddressType(
            address_type=address_type_display,
        )

    # -------------------------------------------------------------------------
    # Default flag
    # -------------------------------------------------------------------------

    make_default = data.pop(
        "is_default",
        None,
    )

    # -------------------------------------------------------------------------
    # Update fields
    # -------------------------------------------------------------------------

    for field, value in data.items():
        setattr(
            address,
            field,
            value,
        )

    address.save()

    # -------------------------------------------------------------------------
    # Default address
    # -------------------------------------------------------------------------

    if make_default:
        address = set_default_address(
            user=user,
            address=address,
        )

    return address
