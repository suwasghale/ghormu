"""
Serializer for updating a user address.
"""

from __future__ import annotations

from apps.profiles.api.serializers.address.base import (
    AddressWriteSerializer,
)


class AddressUpdateSerializer(
    AddressWriteSerializer,
):
    """
    Serializer for updating addresses.
    """

    pass
