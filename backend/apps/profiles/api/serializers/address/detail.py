"""
Serializer for user addresses.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.profiles.models import Address


class AddressSerializer(serializers.ModelSerializer):
    """
    Read serializer for user addresses.
    """

    address_type_display = serializers.CharField(
        source="get_address_type_display",
        read_only=True,
    )

    class Meta:
        model = Address

        fields = (
            "id",
            "address_type",
            "address_type_display",
            "label",
            "street_address",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields
