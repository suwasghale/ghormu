"""
Custom manager for EmailVerificationToken.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from ..querysets import EmailVerificationTokenQuerySet

if TYPE_CHECKING:
    from apps.users.models import EmailVerificationToken, User


class EmailVerificationTokenManager(
    models.Manager.from_queryset(EmailVerificationTokenQuerySet)
):
    """
    Custom manager for EmailVerificationToken.
    """

    def create_verification_token(
        self,
        *,
        user: User,
        token_hash: str,
        expires_at: datetime,
        created_ip: str | None = None,
        user_agent: str = "",
    ) -> EmailVerificationToken:
        """
        Persist a new email verification token.

        Notes:
            - The token must already be hashed.
            - Expiration must already be calculated.
            - Token generation belongs to the service layer.
        """
        return self.create(
            user=user,
            token_hash=token_hash,
            expires_at=expires_at,
            created_ip=created_ip,
            user_agent=user_agent,
        )

    def invalidate_user_tokens(
        self,
        *,
        user: User,
    ) -> int:
        """
        Consume every unused verification token belonging
        to the given user.
        """
        return (
            self.unused()
            .for_user(user)
            .update(
                used_at=timezone.now(),
            )
        )
