"""
Abstract base model for one-time security tokens.

This model contains every field shared by all token models.

Concrete implementations include:

- EmailVerificationToken
- PasswordResetToken
- MagicLoginToken
- InvitationToken

Business logic such as token generation, hashing, validation,
and email sending belongs to the service layer.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class AbstractToken(models.Model):
    """
    Abstract base model for security tokens.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID",
        help_text="Unique identifier for this token.",
    )

    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name="Token hash",
        help_text="SHA-256 hash of the token.",
    )

    expires_at = models.DateTimeField(
        verbose_name="Expires at",
        help_text="Date and time when this token expires.",
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Used at",
        help_text="Date and time when this token was used.",
    )

    created_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Created IP",
        help_text="IP address used when this token was created.",
    )

    user_agent = models.TextField(
        blank=True,
        verbose_name="User agent",
        help_text="Browser or device used to request this token.",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created at",
    )

    @property
    def is_used(self) -> bool:
        """
        Whether this token has already been used.
        """
        return self.used_at is not None

    @property
    def is_expired(self) -> bool:
        """
        Whether this token has expired.
        """
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self) -> bool:
        """
        Whether this token is valid.
        """
        return not self.is_used and not self.is_expired

    def consume(self) -> None:
        """
        Mark this token as used.
        """
        if self.used_at is None:
            self.used_at = timezone.now()
            self.save(update_fields=["used_at"])

    class Meta:
        abstract = True
