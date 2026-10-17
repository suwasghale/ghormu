"""
Custom QuerySet for PasswordResetToken.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from apps.users.models import PasswordResetToken, User


class PasswordResetTokenQuerySet(models.QuerySet["PasswordResetToken"]):
    """
    Custom QuerySet for PasswordResetToken.
    """

    def with_user(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Load the related user using select_related.
        """
        return self.select_related("user")

    def valid(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Return unused and unexpired tokens.
        """
        return self.filter(
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        )

    def expired(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Return expired tokens.
        """
        return self.filter(
            expires_at__lte=timezone.now(),
        )

    def used(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Return consumed tokens.
        """
        return self.filter(
            used_at__isnull=False,
        )

    def unused(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Return unused tokens.
        """
        return self.filter(
            used_at__isnull=True,
        )

    def for_user(
        self,
        user: User,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Return tokens belonging to a specific user.
        """
        return self.filter(
            user=user,
        )

    def newest(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Order tokens from newest to oldest.
        """
        return self.order_by("-created_at")

    def oldest(
        self,
    ) -> models.QuerySet[PasswordResetToken]:
        """
        Order tokens from oldest to newest.
        """
        return self.order_by("created_at")
