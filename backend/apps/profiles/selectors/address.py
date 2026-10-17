"""
Selectors related to the Address model.

Every lookup that can be reached from a request is scoped by owner.

An unscoped `get_address_by_id` existed here and was used by the detail,
delete and set-default endpoints. It produced two problems: an unknown
id raised Address.DoesNotExist and surfaced as a 500, and another user's
id resolved successfully and was only stopped by the ownership check in
the service layer - which answered 403 rather than 404, confirming that
the address existed. Scoping the query makes both cases an identical
404 and removes the reliance on a downstream check.
"""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from apps.profiles.models import Address

# =============================================================================
# Scoped lookups
# =============================================================================


def find_user_address(
    *,
    user_id: UUID,
    address_id: UUID,
) -> Address | None:
    """
    Return one address belonging to the given user, or None.
    """
    return Address.objects.filter(
        id=address_id,
        user_id=user_id,
    ).first()


def list_user_addresses(
    *,
    user_id: UUID,
) -> QuerySet[Address]:
    """
    Return every address belonging to a user.
    """
    return Address.objects.filter(user_id=user_id).order_by(
        "-is_default",
        "-created_at",
    )


def find_default_address(
    *,
    user_id: UUID,
) -> Address | None:
    """
    Return the user's default address, or None.
    """
    return Address.objects.filter(
        user_id=user_id,
        is_default=True,
    ).first()


def count_user_addresses(
    *,
    user_id: UUID,
) -> int:
    """
    Return how many addresses a user has.
    """
    return Address.objects.filter(user_id=user_id).count()
