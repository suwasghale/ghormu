"""
Password reset token model.

This model stores hashed one-time tokens used to securely reset a user's
password.

Security:
- Never store raw tokens.
- Store only a SHA-256 hash.
- Raw tokens are generated and emailed by the service layer.

Business logic such as generating tokens, hashing, sending emails,
and validation belongs in the service layer.

NOTE: The runtime dependency graph is actually:
PasswordResetToken
        │
        ▼
PasswordResetTokenManager
        │
        ▼
PasswordResetTokenQuerySet
"""

from __future__ import annotations

from django.db import models

from apps.users.models import User
from apps.users.models.base import AbstractToken
from apps.users.models.managers import PasswordResetTokenManager


class PasswordResetToken(AbstractToken):
    """
    Password reset token.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name="User",
        help_text="User associated with this password reset token.",
    )

    objects = PasswordResetTokenManager()

    class Meta:
        verbose_name = "Password reset token"
        verbose_name_plural = "Password reset tokens"

        ordering = ("-created_at",)

        indexes = [
            models.Index(
                fields=["user"],
                name="prt_user_idx",
            ),
            models.Index(
                fields=["expires_at"],
                name="prt_expiry_idx",
            ),
            models.Index(
                fields=["used_at"],
                name="prt_used_idx",
            ),
            models.Index(
                fields=["created_at"],
                name="prt_created_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"Password reset token for {self.user.email}"
