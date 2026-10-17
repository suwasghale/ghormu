"""
Selectors for PasswordResetToken.

Selectors are responsible ONLY for reading data.
They never create, update, or delete records.
"""

from __future__ import annotations

from django.db.models import QuerySet

from apps.users.models.tokens import PasswordResetToken
from apps.users.models.user import User

# =============================================================================
# Single Object
# =============================================================================


def get_password_reset_token(
    *,
    token_hash: str,
) -> PasswordResetToken:
    """
    Return a password reset token.

    Raises:
        PasswordResetToken.DoesNotExist
    """
    return PasswordResetToken.objects.with_user().get(token_hash=token_hash)


def find_password_reset_token(
    *,
    token_hash: str,
) -> PasswordResetToken | None:
    """
    Return a password reset token if it exists.
    """
    return PasswordResetToken.objects.with_user().filter(token_hash=token_hash).first()


def find_valid_password_reset_token(
    *,
    token_hash: str,
) -> PasswordResetToken | None:
    """
    Return a valid password reset token.

    A valid token is:
    - unused
    - unexpired
    """
    return (
        PasswordResetToken.objects.with_user()
        .valid()
        .filter(token_hash=token_hash)
        .first()
    )


def get_valid_password_reset_token(
    *,
    token_hash: str,
) -> PasswordResetToken:
    """
    Return a valid password reset token.

    Raises:
        PasswordResetToken.DoesNotExist
    """
    return PasswordResetToken.objects.with_user().valid().get(token_hash=token_hash)


# =============================================================================
# User
# =============================================================================


def list_user_password_reset_tokens(
    *,
    user: type[User],
) -> QuerySet[PasswordResetToken]:
    """
    Return every password reset token belonging to a user.
    """
    return PasswordResetToken.objects.with_user().for_user(user).newest()


def list_valid_user_password_reset_tokens(
    *,
    user: User,
) -> QuerySet[PasswordResetToken]:
    """
    Return every valid password reset token belonging to a user.
    """
    return PasswordResetToken.objects.with_user().valid().for_user(user).newest()


def get_latest_password_reset_token(
    *,
    user: User,
) -> PasswordResetToken | None:
    """
    Return the most recent password reset token.
    """
    return list_user_password_reset_tokens(
        user=user,
    ).first()


# =============================================================================
# Boolean
# =============================================================================


def exists_password_reset_token(
    *,
    token_hash: str,
) -> bool:
    """
    Return whether a password reset token exists.
    """
    return PasswordResetToken.objects.filter(token_hash=token_hash).exists()


def has_valid_password_reset_token(
    *,
    user: User,
) -> bool:
    """
    Return whether the user has at least one valid password reset token.
    """
    return PasswordResetToken.objects.valid().for_user(user).exists()
