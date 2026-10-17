"""
Serializers for email verification.
"""

from __future__ import annotations

from rest_framework import serializers


class EmailVerificationSerializer(serializers.Serializer):
    """
    Validate an email verification token.
    """

    token = serializers.CharField(
        max_length=255,
        trim_whitespace=True,
        required=True,
        help_text="Raw email verification token.",
    )

    def validate_token(
        self,
        value: str,
    ) -> str:
        """
        Normalize the token.

        Business validation (existence, expiry, etc.)
        belongs to the service layer.
        """

        token = value.strip()

        if not token:
            raise serializers.ValidationError("Verification token is required.")

        return token
