"""
Email verification token model.

This model stores hashed verification tokens used to verify a user's
email address after registration.

Security:
- Never store raw tokens.
- Store only a SHA-256 hash.
- Raw tokens are generated and emailed by the service layer.

Business logic such as generating tokens, hashing, sending emails,
and validation belongs in the service layer.
"""

from __future__ import annotations

from django.db import models

from apps.users.models import User
from apps.users.models.base.abstract_token import AbstractToken
from apps.users.models.managers import EmailVerificationTokenManager


class EmailVerificationToken(AbstractToken):
    """
    Email verification token.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
        verbose_name="User",
        help_text="User associated with this verification token.",
    )

    objects = EmailVerificationTokenManager()

    class Meta:
        verbose_name = "Email verification token"
        verbose_name_plural = "Email verification tokens"

        ordering = ("-created_at",)

        indexes = [
            models.Index(fields=["user"], name="evt_user_idx"),
            models.Index(fields=["expires_at"], name="evt_expiry_idx"),
            models.Index(fields=["used_at"], name="evt_used_idx"),
            models.Index(fields=["created_at"], name="evt_created_idx"),
        ]

    def __str__(self) -> str:
        return f"Email verification token for {self.user.email}"
