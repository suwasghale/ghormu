"""
User session model.
"""

from __future__ import annotations

import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django_countries.fields import CountryField
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
)

from apps.users.choices import (
    DeviceTypeChoices,
    LoginMethodChoices,
    RevokeReasonChoices,
)
from apps.users.models.user import User


class UserSession(models.Model):
    """
    Stores device information for each authenticated session.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    token = models.OneToOneField(
        OutstandingToken,
        on_delete=models.CASCADE,
        related_name="session",
    )

    session_key = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, db_index=True
    )

    # ------------------------------------------------------------------
    # Device
    # ------------------------------------------------------------------

    device_name = models.CharField(
        max_length=100,
        blank=True,
    )

    device_type = models.CharField(
        max_length=20,
        choices=DeviceTypeChoices.choices,
        default=DeviceTypeChoices.PHONE,
        verbose_name="Device type",
    )

    browser = models.CharField(
        max_length=100,
        blank=True,
    )

    browser_version = models.CharField(
        max_length=50,
        blank=True,
    )

    operating_system = models.CharField(
        max_length=100,
        blank=True,
    )

    operating_system_version = models.CharField(
        max_length=50,
        blank=True,
    )

    # ------------------------------------------------------------------
    # Network
    # ------------------------------------------------------------------

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(blank=True)

    # Future GeoIP

    country = CountryField(
        blank=True,
        null=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    # ------------------------------------------------------------------
    # Security
    # ------------------------------------------------------------------

    is_trusted = models.BooleanField(
        default=False,
        verbose_name="Trusted device",
    )

    mfa_verified = models.BooleanField(
        default=False,
        verbose_name="MFA verified",
    )

    risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    # ------------------------------------------------------------------
    # Session Lifecycle
    # ------------------------------------------------------------------

    login_method = models.CharField(
        max_length=30,
        choices=LoginMethodChoices.choices,
        default=LoginMethodChoices.PASSWORD,
        verbose_name="Login method",
        help_text=("Examples: password, google, github, magic_link."),
    )

    logout_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Logged out at",
    )

    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Revoked at",
    )

    revoke_reason = models.CharField(
        max_length=50,
        choices=RevokeReasonChoices.choices,
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------
    # Location
    # ------------------------------------------------------------------

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Latitude",
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Longitude",
    )

    # ------------------------------------------------------------------
    # Activity
    # ------------------------------------------------------------------

    last_activity = models.DateTimeField(
        auto_now=True,
    )

    login_at = models.DateTimeField(
        auto_now_add=True,
    )

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    is_active = models.BooleanField(
        default=True,
        verbose_name="Active session",
    )

    class Meta:
        ordering = ("-last_activity",)

        indexes = [
            models.Index(
                fields=[
                    "user",
                ],
                name="session_user_idx",
            ),
            models.Index(
                fields=[
                    "last_activity",
                ],
                name="session_activity_idx",
            ),
            models.Index(
                fields=["is_active"],
                name="session_active_idx",
            ),
            models.Index(
                fields=["login_at"],
                name="session_login_idx",
            ),
            models.Index(
                fields=["ip_address"],
                name="session_ip_idx",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_name}"
