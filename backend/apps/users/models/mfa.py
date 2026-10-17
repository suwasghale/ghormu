"""
Multi-factor authentication models.

Two records per user at most:

- ``TOTPDevice``  the shared secret behind an authenticator app.
- ``RecoveryCode`` single-use codes for when the device is lost.

Both store secrets the same way the one-time tokens do: recovery codes
are hashed and never recoverable. The TOTP secret cannot be hashed - it
has to be readable to compute the expected code - so it is the one
piece of genuinely sensitive plaintext in the schema. See
docs/security.md for what that implies.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TOTPDevice(models.Model):
    """
    A time-based one-time password authenticator bound to a user.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="totp_device",
        verbose_name=_("User"),
    )

    secret = models.CharField(
        max_length=64,
        verbose_name=_("Shared secret"),
        help_text=_("Base32 secret shared with the authenticator app."),
    )

    # Enrolment is two-step: the secret is created when the QR code is
    # issued, but does not protect the account until the user proves
    # they scanned it. An unconfirmed device is ignored at login, so a
    # half-finished enrolment cannot lock anybody out.
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Confirmed at"),
    )

    # Guards against replay: a code stays valid for its whole window, so
    # without this an attacker who observes one can reuse it.
    last_used_counter = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Last accepted counter"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("TOTP device")
        verbose_name_plural = _("TOTP devices")

    @property
    def is_confirmed(self) -> bool:
        return self.confirmed_at is not None

    def confirm(self) -> None:
        self.confirmed_at = timezone.now()
        self.save(update_fields=["confirmed_at", "updated_at"])

    def __str__(self) -> str:
        state = "confirmed" if self.is_confirmed else "pending"
        return f"TOTP device for {self.user_id} ({state})"


class RecoveryCode(models.Model):
    """
    A single-use code that substitutes for the authenticator app.

    Stored as a hash. A database leak yields digests, not usable codes,
    which matters more here than for a password because these bypass
    the second factor entirely.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="recovery_codes",
        verbose_name=_("User"),
    )

    code_hash = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name=_("Code hash"),
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Used at"),
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Recovery code")
        verbose_name_plural = _("Recovery codes")
        ordering = ("created_at",)

        indexes = [
            models.Index(
                fields=["user", "used_at"],
                name="recovery_user_used_idx",
            ),
        ]

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    def __str__(self) -> str:
        return f"Recovery code for {self.user_id}"
