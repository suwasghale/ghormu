"""
Serializers for multi-factor authentication.
"""

from __future__ import annotations

from rest_framework import serializers


class MFAEnrolStartResponseSerializer(serializers.Serializer):
    """
    What the client needs to add the account to an authenticator app.
    """

    secret = serializers.CharField(read_only=True)
    provisioning_uri = serializers.CharField(read_only=True)


class MFACodeSerializer(serializers.Serializer):
    """
    A code from the authenticator app, or a recovery code.
    """

    code = serializers.CharField(
        max_length=32,
        trim_whitespace=True,
    )


class MFAVerifySerializer(MFACodeSerializer):
    """
    Exchanging a login challenge for tokens.
    """

    mfa_ticket = serializers.CharField(
        max_length=128,
        trim_whitespace=True,
    )


class MFADisableSerializer(MFACodeSerializer):
    """
    Turning the second factor off.

    Requires the current password as well as a code: an attacker who
    has captured a live session should not be able to strip the second
    factor with the session alone.
    """

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )


class RecoveryCodesResponseSerializer(serializers.Serializer):
    """
    Recovery codes, returned exactly once.
    """

    codes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )


class MFAStatusSerializer(serializers.Serializer):
    """
    Whether the second factor is on, and how much recovery is left.
    """

    enabled = serializers.BooleanField(read_only=True)
    recovery_codes_remaining = serializers.IntegerField(read_only=True)
