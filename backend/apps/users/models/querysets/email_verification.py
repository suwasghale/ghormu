"""
Custom QuerySet for EmailVerificationToken.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from apps.users.models import EmailVerificationToken, User


class EmailVerificationTokenQuerySet(
    models.QuerySet["EmailVerificationToken"],
):
    """
    Custom QuerySet for EmailVerificationToken.
    """

    def with_user(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Load the related user using select_related.
        """
        return self.select_related(
            "user",
        )

    def valid(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Return unused and unexpired verification tokens.
        """
        now = timezone.now()

        return self.filter(
            used_at__isnull=True,
            expires_at__gt=now,
        )

    def expired(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Return expired verification tokens.
        """
        return self.filter(
            expires_at__lte=timezone.now(),
        )

    def used(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Return consumed verification tokens.
        """
        return self.filter(
            used_at__isnull=False,
        )

    def unused(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Return unused verification tokens.
        """
        return self.filter(
            used_at__isnull=True,
        )

    def for_user(
        self,
        user: User,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Return verification tokens belonging to a specific user.
        """
        return self.filter(
            user=user,
        )

    def newest(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Order verification tokens from newest to oldest.
        """
        return self.order_by(
            "-created_at",
        )

    def oldest(
        self,
    ) -> models.QuerySet[EmailVerificationToken]:
        """
        Order verification tokens from oldest to newest.
        """
        return self.order_by(
            "created_at",
        )


"""
Architecture Notes
------------------

QuerySets are responsible only for constructing reusable database queries.

They must NOT perform write operations such as:

- create()
- bulk_create()
- update()
- delete()
- get_or_create()
- update_or_create()

Selectors are responsible for terminal read operations such as:

- first()
- last()
- get()
- exists()
- count()

Managers and Services are responsible for write operations.
"""
