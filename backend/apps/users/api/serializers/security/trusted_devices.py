"""
Serializer for trusted devices.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import UserSession


class TrustedDeviceSerializer(serializers.ModelSerializer):
    """
    Serialize a trusted device.
    """

    country = serializers.CharField(
        source="country.name",
        read_only=True,
    )

    class Meta:
        model = UserSession

        fields = (
            "id",
            "session_key",
            "device_name",
            "device_type",
            "browser",
            "browser_version",
            "operating_system",
            "operating_system_version",
            "country",
            "city",
            "ip_address",
            "login_method",
            "login_at",
            "last_activity",
            "is_trusted",
            "mfa_verified",
            "risk_score",
        )

        read_only_fields = fields
