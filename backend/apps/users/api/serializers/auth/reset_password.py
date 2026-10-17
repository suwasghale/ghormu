"""
Serializer for resetting a user's password.
"""

from __future__ import annotations

from rest_framework import serializers

from core.validators.password import (
    validate_password_strength,
)


class ResetPasswordSerializer(serializers.Serializer):
    """
    Validate password reset request.
    """

    token = serializers.CharField(
        required=True,
        trim_whitespace=True,
        help_text="Password reset token.",
    )

    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
        validators=[validate_password_strength],
        help_text="New password.",
    )

    password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
        help_text="Password confirmation.",
    )

    def validate(
        self,
        attrs: dict,
    ) -> dict:
        """
        Ensure both passwords match.
        """

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": ("Passwords do not match.")}
            )

        return attrs
