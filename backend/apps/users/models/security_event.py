"""
Security event audit model.
"""

from __future__ import annotations

import uuid

from django.db import models

from apps.users.choices import (
    DeviceTypeChoices,
    SecurityEventStatusChoices,
    SecurityEventTypeChoices,
)
from apps.users.models.session import UserSession
from apps.users.models.user import User


class SecurityEvent(models.Model):
    """
    Immutable security audit event.

    Every important authentication and security action performed
    by a user is recorded here.

    Records are append-only and should never be modified after creation.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="security_events",
    )

    session = models.ForeignKey(
        UserSession,
        on_delete=models.SET_NULL,
        related_name="security_events",
        null=True,
        blank=True,
    )

    event_type = models.CharField(
        max_length=50,
        choices=SecurityEventTypeChoices.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=SecurityEventStatusChoices.choices,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    device_name = models.CharField(
        max_length=120,
        blank=True,
    )

    device_type = models.CharField(
        max_length=20,
        choices=DeviceTypeChoices.choices,
        default=DeviceTypeChoices.UNKNOWN,
    )

    browser = models.CharField(
        max_length=120,
        blank=True,
    )

    browser_version = models.CharField(
        max_length=120,
        blank=True,
    )

    operating_system = models.CharField(
        max_length=120,
        blank=True,
    )

    operating_system_version = models.CharField(
        max_length=120,
        blank=True,
    )

    country = models.CharField(
        max_length=120,
        null=True,
        blank=True,
    )

    city = models.CharField(
        max_length=120,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "user_security_events"

        ordering = ("-created_at",)

        indexes = [
            models.Index(
                fields=(
                    "user",
                    "-created_at",
                ),
            ),
            models.Index(
                fields=("event_type",),
            ),
            models.Index(
                fields=("status",),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} • {self.event_type} • {self.created_at}"
