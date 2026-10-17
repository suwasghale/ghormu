"""
Serializer for requesting an email change.
"""

from __future__ import annotations

from rest_framework import serializers


class RequestEmailChangeSerializer(serializers.Serializer):
    """
    Validate an email change request.
    """

    new_email = serializers.EmailField(
        required=True,
        help_text="New email address.",
    )

    def validate_new_email(
        self,
        value: str,
    ) -> str:
        """
        Normalize the email address.
        """

        return value.strip().lower()
