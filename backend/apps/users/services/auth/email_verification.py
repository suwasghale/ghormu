"""
Email verification services.

Business logic for:

- creating verification tokens
- sending verification emails
- verifying email tokens
- resending verification emails

Views should never contain this logic.
"""

from __future__ import annotations

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import (
    EmailAlreadyVerified,
    EmailVerificationTokenExpired,
    EmailVerificationTokenInvalid,
)
from apps.users.models import User
from apps.users.models.tokens.email_verification import (
    EmailVerificationToken,
)
from apps.users.selectors.auth.email_verification import (
    find_verification_token,
)
from apps.users.selectors.user import find_user_by_email
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)
from apps.users.tasks.emails import send_email_verification_email
from apps.users.utils.urls import build_email_verification_url
from core.security.tokens import generate_hashed_token, hash_token


@transaction.atomic
def create_email_verification(
    *,
    user: User,
    created_ip: str | None,
    user_agent: str,
) -> None:
    """
    Create a fresh verification token and queue the email.
    """

    EmailVerificationToken.objects.invalidate_user_tokens(
        user=user,
    )

    raw_token, token_hash = generate_hashed_token()

    expires_at = timezone.now() + settings.EMAIL_VERIFICATION_TOKEN_LIFETIME

    EmailVerificationToken.objects.create_verification_token(
        user=user,
        token_hash=token_hash,
        expires_at=expires_at,
        created_ip=created_ip,
        user_agent=user_agent,
    )

    verification_url = build_email_verification_url(
        token=raw_token,
    )

    # Dispatched after commit so the worker cannot race ahead of the
    # token row, and so a rolled-back registration sends no email.
    transaction.on_commit(
        lambda: send_email_verification_email.delay(
            recipient=user.email,
            full_name=user.full_name,
            verification_url=verification_url,
        )
    )


@transaction.atomic
def verify_email(
    *,
    raw_token: str,
    request=None,
) -> User:
    """
    Verify a user's email.
    """

    token_hash = hash_token(raw_token)

    token = find_verification_token(
        token_hash=token_hash,
    )

    if token is None or token.used_at is not None:
        raise EmailVerificationTokenInvalid()

    if token.expires_at <= timezone.now():
        raise EmailVerificationTokenExpired()

    if token.user.is_verified:
        raise EmailAlreadyVerified()

    user = token.user

    user.is_verified = True

    user.save(
        update_fields=[
            "is_verified",
            "updated_at",
        ],
    )

    token.used_at = timezone.now()

    token.save(
        update_fields=[
            "used_at",
        ],
    )

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.EMAIL_VERIFIED,
    )

    return user


@transaction.atomic
def resend_email_verification(
    *,
    email: str,
    created_ip: str | None,
    user_agent: str,
) -> None:
    """
    Send a fresh verification email.

    Always returns successfully to avoid email enumeration.
    """

    user = find_user_by_email(email=email)

    # Do not reveal whether the account exists, whether it is already
    # verified, or whether it has been disabled.
    if (
        user is None
        or user.is_verified
        or not user.is_active
        or user.deleted_at is not None
    ):
        return

    create_email_verification(
        user=user,
        created_ip=created_ip,
        user_agent=user_agent,
    )
