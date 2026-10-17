"""
Serializers for password reset.

Serializers are responsible only for:

- validating incoming request data
- normalizing input
- running Django password validators

They NEVER contain business logic.
"""

from __future__ import annotations

from apps.users.api.serializers.base import (
    EmailSerializer,
    TokenPasswordSerializer,
    TokenSerializer,
)

# =============================================================================
# Password Reset Request
# =============================================================================


class PasswordResetRequestSerializer(
    EmailSerializer,
):
    """
    Serializer used to request a password reset email.
    """

    pass


# =============================================================================
# Password Reset Verification
# =============================================================================


class PasswordResetVerifySerializer(
    TokenSerializer,
):
    """
    Serializer used to verify a password reset token.
    """

    pass


# =============================================================================
# Password Reset Confirmation
# =============================================================================


class PasswordResetConfirmSerializer(
    TokenPasswordSerializer,
):
    """
    Serializer used to reset a password.
    """

    pass
