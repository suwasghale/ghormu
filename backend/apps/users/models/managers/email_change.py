"""
Custom manager for EmailChangeToken.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from apps.users.models.querysets import (
    EmailChangeTokenQuerySet,
)

if TYPE_CHECKING:
    from apps.users.models import (
        EmailChangeToken,
        User,
    )


class EmailChangeTokenManager(
    models.Manager.from_queryset(
        EmailChangeTokenQuerySet,
    )
):
    """
    Custom manager for EmailChangeToken.
    """

    def create_email_change_token(
        self,
        *,
        user: User,
        new_email: str,
        token_hash: str,
        expires_at: datetime,
        created_ip: str | None = None,
        user_agent: str = "",
    ) -> EmailChangeToken:
        """
        Persist a new email change token.

        Notes:
            - token_hash must already be hashed.
            - expires_at must already be calculated.
            - raw token generation belongs to the service layer.
        """

        return self.create(
            user=user,
            new_email=new_email,
            token_hash=token_hash,
            expires_at=expires_at,
            created_ip=created_ip,
            user_agent=user_agent,
        )

    def consume_unused_tokens(
        self,
        *,
        user: User,
    ) -> int:
        """
        Consume every unused email change token
        belonging to the user.

        Returns:
            Number of consumed tokens.
        """

        return (
            self.unused()
            .for_user(user)
            .update(
                used_at=timezone.now(),
            )
        )
