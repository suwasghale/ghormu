"""
Base serializer for address write operations.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.profiles.models import Address


class AddressWriteSerializer(serializers.ModelSerializer):
    """
    Shared serializer for creating and updating addresses.
    """

    class Meta:
        model = Address

        fields = (
            "address_type",
            "label",
            "street_address",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
        )

    # -------------------------------------------------------------------------
    # Normalization
    # -------------------------------------------------------------------------

    @staticmethod
    def _normalize(value: str) -> str:
        return value.strip()

    def validate_label(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)

    def validate_street_address(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)

    def validate_address_line_2(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)

    def validate_city(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)

    def validate_state(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)

    def validate_postal_code(
        self,
        value: str,
    ) -> str:
        return self._normalize(value)
