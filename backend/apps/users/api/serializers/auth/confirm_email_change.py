"""
Serializer for confirming an email change.
"""

from __future__ import annotations

from rest_framework import serializers


class ConfirmEmailChangeSerializer(serializers.Serializer):
    """
    Validate an email change confirmation request.
    """

    token = serializers.CharField(
        required=True,
        trim_whitespace=True,
        help_text="Email change verification token.",
    )
