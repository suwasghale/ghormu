"""
Account validation rules.
"""

from __future__ import annotations

from apps.users.exceptions.authentication import (
    EmailNotVerified,
    InactiveAccount,
)
from apps.users.models import User


def validate_account(
    *,
    user: User,
) -> None:
    """
    Validate that a user may authenticate.
    """

    if not user.is_active:
        raise InactiveAccount()

    if not user.is_verified:
        raise EmailNotVerified()
