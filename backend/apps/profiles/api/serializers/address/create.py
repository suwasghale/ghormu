"""
Serializer for creating a user address.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.profiles.api.serializers.address.base import (
    AddressWriteSerializer,
)
from apps.profiles.models import Address


class AddressCreateSerializer(AddressWriteSerializer):
    """
    Serializer for creating a user address.
    """

    def validate(self, attrs):
        user = self.context["request"].user

        if Address.objects.filter(
            user=user,
            address_type=attrs["address_type"],
        ).exists():
            address_type = Address(
                address_type=attrs["address_type"],
            ).get_address_type_display()

            article = "An" if address_type[0].lower() in "aeiou" else "A"

            raise serializers.ValidationError(
                {
                    "address_type": (
                        f"{article} {address_type} address already exists. "
                        "Update it instead."
                    )
                }
            )

        return attrs
