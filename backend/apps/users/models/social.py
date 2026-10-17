"""
Social account links.

One row per (provider, subject) pair. Keyed on the provider's stable
subject identifier rather than on the email address: an address can be
released and reassigned by the provider, the subject cannot.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class SocialAccount(models.Model):
    """
    A third-party identity linked to a local user.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="social_accounts",
        verbose_name=_("User"),
    )

    provider = models.CharField(
        max_length=40,
        verbose_name=_("Provider"),
    )

    subject = models.CharField(
        max_length=255,
        verbose_name=_("Provider subject"),
        help_text=_(
            "Stable identifier at the provider. Never the email "
            "address, which can change hands."
        ),
    )

    email = models.EmailField(
        blank=True,
        verbose_name=_("Provider email"),
        help_text=_(
            "The address as reported by the provider, kept for "
            "auditing. Not authoritative."
        ),
    )

    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Last used"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Social account")
        verbose_name_plural = _("Social accounts")

        constraints = [
            # One local account per provider identity. Without this the
            # same Google account could be linked to two local users and
            # sign-in would be ambiguous.
            models.UniqueConstraint(
                fields=("provider", "subject"),
                name="unique_provider_subject",
            ),
            # And at most one link per provider per user, so "sign in
            # with Google" cannot silently accumulate duplicates.
            models.UniqueConstraint(
                fields=("user", "provider"),
                name="unique_provider_per_user",
            ),
        ]

        indexes = [
            models.Index(
                fields=["provider", "subject"],
                name="social_lookup_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.provider}:{self.subject}"
