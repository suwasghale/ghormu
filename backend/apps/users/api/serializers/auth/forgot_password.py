"""
Serializer for requesting a password reset email.
"""

from __future__ import annotations

from rest_framework import serializers


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Validate password reset request.
    """

    email = serializers.EmailField(
        required=True,
    )
