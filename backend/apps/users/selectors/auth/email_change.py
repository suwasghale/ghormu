"""
Selectors for EmailChangeToken.

Selectors are responsible ONLY for reading data.
They never create, update, or delete records.
"""

from __future__ import annotations

from django.db.models import QuerySet

from apps.users.models import User
from apps.users.models.tokens import EmailChangeToken

# =============================================================================
# Single Object
# =============================================================================


def get_email_change_token(
    *,
    token_hash: str,
) -> EmailChangeToken:
    """
    Return an email change token.

    Raises:
        EmailChangeToken.DoesNotExist
    """
    return EmailChangeToken.objects.with_user().get(
        token_hash=token_hash,
    )


def find_email_change_token(
    *,
    token_hash: str,
) -> EmailChangeToken | None:
    """
    Return an email change token if it exists.
    """
    return (
        EmailChangeToken.objects.with_user()
        .filter(
            token_hash=token_hash,
        )
        .first()
    )


def get_valid_email_change_token(
    *,
    token_hash: str,
) -> EmailChangeToken:
    """
    Return a valid email change token.

    Raises:
        EmailChangeToken.DoesNotExist
    """
    return (
        EmailChangeToken.objects.with_user()
        .valid()
        .get(
            token_hash=token_hash,
        )
    )


def find_valid_email_change_token(
    *,
    token_hash: str,
) -> EmailChangeToken | None:
    """
    Return a valid email change token.
    """
    return (
        EmailChangeToken.objects.with_user()
        .valid()
        .filter(
            token_hash=token_hash,
        )
        .first()
    )


# =============================================================================
# User
# =============================================================================


def list_user_email_change_tokens(
    *,
    user: User,
) -> QuerySet[EmailChangeToken]:
    """
    Return every email change token belonging to a user.
    """
    return EmailChangeToken.objects.with_user().for_user(user).newest()


def list_valid_user_email_change_tokens(
    *,
    user: User,
) -> QuerySet[EmailChangeToken]:
    """
    Return every valid email change token belonging to a user.
    """
    return EmailChangeToken.objects.with_user().valid().for_user(user).newest()


def get_latest_email_change_token(
    *,
    user: User,
) -> EmailChangeToken | None:
    """
    Return the latest email change token.
    """
    return list_user_email_change_tokens(
        user=user,
    ).first()


# =============================================================================
# Boolean
# =============================================================================


def exists_email_change_token(
    *,
    token_hash: str,
) -> bool:
    """
    Return whether a token exists.
    """
    return EmailChangeToken.objects.filter(
        token_hash=token_hash,
    ).exists()


def has_valid_email_change_token(
    *,
    user: User,
) -> bool:
    """
    Return whether the user has at least one valid email change token.
    """
    return EmailChangeToken.objects.valid().for_user(user).exists()
