"""
Custom QuerySet for EmailChangeToken.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from apps.users.models import EmailChangeToken, User


class EmailChangeTokenQuerySet(models.QuerySet["EmailChangeToken"]):
    """
    Custom QuerySet for EmailChangeToken.
    """

    def with_user(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Load the related user.
        """
        return self.select_related("user")

    def valid(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return unused and unexpired tokens.
        """
        return self.filter(
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        )

    def expired(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return expired tokens.
        """
        return self.filter(
            expires_at__lte=timezone.now(),
        )

    def used(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return consumed tokens.
        """
        return self.filter(
            used_at__isnull=False,
        )

    def unused(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return unused tokens.
        """
        return self.filter(
            used_at__isnull=True,
        )

    def for_user(
        self,
        user: User,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return tokens belonging to a user.
        """
        return self.filter(
            user=user,
        )

    def for_new_email(
        self,
        new_email: str,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Return tokens created for a specific new email.
        """
        return self.filter(
            new_email__iexact=new_email,
        )

    def newest(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Order newest first.
        """
        return self.order_by("-created_at")

    def oldest(
        self,
    ) -> models.QuerySet[EmailChangeToken]:
        """
        Order oldest first.
        """
        return self.order_by("created_at")
