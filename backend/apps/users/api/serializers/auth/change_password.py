"""
Serializer for changing the authenticated user's password.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.exceptions import (
    PasswordMismatch,
)


class ChangePasswordSerializer(serializers.Serializer):
    """
    Validate change password request.
    """

    current_password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    new_password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    def validate(
        self,
        attrs: dict,
    ) -> dict:
        """
        Validate password confirmation.
        """

        if attrs["new_password"] != attrs["confirm_password"]:
            raise PasswordMismatch()

        return attrs
