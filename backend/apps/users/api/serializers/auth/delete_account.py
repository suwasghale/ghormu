"""
Serializer for deleting the authenticated user's account.
"""

from __future__ import annotations

from rest_framework import serializers


class DeleteAccountSerializer(serializers.Serializer):
    """
    Confirm account deletion.

    The current password is always required. When the account has a
    second factor, a code from it (or a recovery code) is required too:
    otherwise a stolen session plus a phished password is enough to
    destroy an account that two-factor authentication was meant to
    protect.
    """

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )

    code = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=32,
        trim_whitespace=True,
        help_text="Required when two-factor authentication is enabled.",
    )
