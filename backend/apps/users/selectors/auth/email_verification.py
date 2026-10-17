"""
Selectors for EmailVerificationToken.

Selectors are responsible ONLY for reading data.
They never create, update, or delete records.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import QuerySet

from apps.users.models.tokens import EmailVerificationToken

if TYPE_CHECKING:
    from apps.users.models import User


# =============================================================================
# Single Object
# =============================================================================


def get_verification_token(
    *,
    token_hash: str,
) -> EmailVerificationToken:
    """
    Return a verification token.

    Raises:
        EmailVerificationToken.DoesNotExist
    """
    return EmailVerificationToken.objects.with_user().get(token_hash=token_hash)


def find_verification_token(
    *,
    token_hash: str,
) -> EmailVerificationToken | None:
    """
    Return a verification token if it exists.
    """
    return (
        EmailVerificationToken.objects.with_user().filter(token_hash=token_hash).first()
    )


def find_valid_verification_token(
    *,
    token_hash: str,
) -> EmailVerificationToken | None:
    """
    Return a valid verification token.

    A valid token is:
    - unused
    - unexpired
    """
    return (
        EmailVerificationToken.objects.with_user()
        .valid()
        .filter(token_hash=token_hash)
        .first()
    )


# =============================================================================
# User
# =============================================================================


def list_user_verification_tokens(
    *,
    user: User,
) -> QuerySet[EmailVerificationToken]:
    """
    Return every verification token belonging to a user.
    """
    return EmailVerificationToken.objects.with_user().for_user(user).newest()


def list_valid_user_verification_tokens(
    *,
    user: User,
) -> QuerySet[EmailVerificationToken]:
    """
    Return every valid verification token belonging to a user.
    """
    return EmailVerificationToken.objects.with_user().valid().for_user(user).newest()


def get_latest_verification_token(
    *,
    user: User,
) -> EmailVerificationToken | None:
    """
    Return the most recent verification token.
    """
    return list_user_verification_tokens(
        user=user,
    ).first()


# =============================================================================
# Boolean
# =============================================================================


def exists_verification_token(
    *,
    token_hash: str,
) -> bool:
    """
    Return whether a verification token exists.
    """
    return EmailVerificationToken.objects.filter(token_hash=token_hash).exists()


def has_valid_verification_token(
    *,
    user: User,
) -> bool:
    """
    Return whether the user has at least one valid verification token.
    """
    return EmailVerificationToken.objects.valid().for_user(user).exists()
