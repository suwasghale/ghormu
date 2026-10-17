"""
Password authentication helpers.
"""

from __future__ import annotations

from django.contrib.auth.hashers import check_password

from apps.users.exceptions.authentication import (
    InvalidCredentials,
)
from apps.users.models import User


def verify_password(
    *,
    user: User,
    password: str,
) -> None:
    """
    Verify a user's password.

    Raises:
        InvalidCredentials
    """

    if not check_password(password, user.password):
        raise InvalidCredentials()
