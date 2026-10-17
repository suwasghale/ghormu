"""
Serializer for user login.
"""

from __future__ import annotations

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """
    Validate login credentials.
    """

    email = serializers.EmailField(
        required=True,
    )

    password = serializers.CharField(
        required=True,
        trim_whitespace=False,
        write_only=True,
        style={
            "input_type": "password",
        },
    )
