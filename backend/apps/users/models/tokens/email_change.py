"""
Email change token model.

Stores hashed one-time tokens used to securely change
a user's email address.

Security:
- Never store raw tokens.
- Store only a SHA-256 hash.
- The requested new email is stored until verification.
"""

from __future__ import annotations

from django.db import models

from apps.users.models import User
from apps.users.models.base import AbstractToken
from apps.users.models.managers import EmailChangeTokenManager


class EmailChangeToken(AbstractToken):
    """
    Email change token.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_change_tokens",
        verbose_name="User",
    )

    new_email = models.EmailField(
        verbose_name="New email",
        help_text="Email address requested by the user.",
    )

    objects = EmailChangeTokenManager()

    class Meta:
        verbose_name = "Email change token"
        verbose_name_plural = "Email change tokens"

        ordering = ("-created_at",)

        indexes = [
            models.Index(
                fields=["user"],
                name="ect_user_idx",
            ),
            models.Index(
                fields=["new_email"],
                name="ect_email_idx",
            ),
            models.Index(
                fields=["expires_at"],
                name="ect_expiry_idx",
            ),
            models.Index(
                fields=["used_at"],
                name="ect_used_idx",
            ),
            models.Index(
                fields=["created_at"],
                name="ect_created_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"Email change for {self.user.email} → {self.new_email}"
