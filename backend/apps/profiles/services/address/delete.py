"""
Service for deleting a user's address.
"""

from __future__ import annotations

from django.db import transaction

from apps.profiles.models import Address
from apps.users.exceptions.permission import PermissionDenied
from apps.users.models import User


@transaction.atomic
def delete_address(
    *,
    user: User,
    address: Address,
) -> None:
    """
    Delete a user's address.
    """

    if address.user_id != user.id:
        raise PermissionDenied("You do not have permission to delete this address.")

    was_default = address.is_default

    address.delete()

    if was_default:
        next_address = (
            Address.objects.filter(
                user=user,
            )
            .order_by(
                "-created_at",
            )
            .first()
        )

        if next_address:
            next_address.is_default = True

            next_address.save(
                update_fields=[
                    "is_default",
                ],
            )
