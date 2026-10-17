"""
Email change token services.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.users.exceptions.authentication import (
    EmailChangeTokenInvalid,
)
from apps.users.models import User
from apps.users.models.tokens import EmailChangeToken
from apps.users.selectors.auth.email_change import (
    get_valid_email_change_token,
)
from config.settings.env import env
from core.security.tokens import (
    generate_hashed_token,
    hash_token,
)

# =============================================================================
# Settings
# =============================================================================

EMAIL_CHANGE_TOKEN_BYTES = env.int(
    "EMAIL_CHANGE_TOKEN_BYTES",
    default=32,
)

EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES = env.int(
    "EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES",
    default=30,
)


# =============================================================================
# DTO
# =============================================================================


@dataclass(slots=True)
class CreatedEmailChangeToken:
    """
    Newly created email change token.

    The raw token must only be emailed.
    """

    token: EmailChangeToken
    raw_token: str


# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def create_email_change_token(
    *,
    user: User,
    new_email: str,
    created_ip: str | None = None,
    user_agent: str = "",
) -> CreatedEmailChangeToken:
    """
    Create a new email change token.
    """

    raw_token, token_hash = generate_hashed_token(
        nbytes=EMAIL_CHANGE_TOKEN_BYTES,
    )

    expires_at = timezone.now() + timedelta(
        minutes=EMAIL_CHANGE_TOKEN_EXPIRY_MINUTES,
    )

    token = EmailChangeToken.objects.create_email_change_token(
        user=user,
        new_email=new_email,
        token_hash=token_hash,
        expires_at=expires_at,
        created_ip=created_ip,
        user_agent=user_agent,
    )

    return CreatedEmailChangeToken(
        token=token,
        raw_token=raw_token,
    )


def verify_email_change_token(
    *,
    raw_token: str,
) -> EmailChangeToken:
    """
    Verify an email change token.
    """

    token_hash = hash_token(raw_token)

    try:
        token = get_valid_email_change_token(
            token_hash=token_hash,
        )

    except EmailChangeToken.DoesNotExist as exc:
        raise EmailChangeTokenInvalid(
            "Email change token is invalid or has expired."
        ) from exc

    if not token.user.is_active:
        raise EmailChangeTokenInvalid("User account is inactive.")

    return token


@transaction.atomic
def consume_email_change_tokens(
    *,
    user: User,
) -> int:
    """
    Consume every unused email change token.
    """

    return EmailChangeToken.objects.consume_unused_tokens(
        user=user,
    )
