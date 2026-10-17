"""
Reusable password validation helpers.
"""

from __future__ import annotations

from django.contrib.auth.password_validation import (
    validate_password,
)

from apps.users.exceptions import (
    CurrentPasswordInvalid,
    PasswordReuseNotAllowed,
)
from apps.users.models import User

# =============================================================================
# Current Password
# =============================================================================


def validate_current_password(
    *,
    user: User,
    current_password: str,
) -> None:
    """
    Ensure the supplied current password is correct.

    Raises:
        CurrentPasswordInvalid
    """

    if not user.check_password(current_password):
        raise CurrentPasswordInvalid()


# =============================================================================
# New Password
# =============================================================================


def validate_new_password(
    *,
    user: User,
    new_password: str,
) -> None:
    """
    Validate the new password.

    Checks:

    - Django password validators
    - Password is different from current password

    Raises:
        PasswordReuseNotAllowed
        ValidationError
    """

    if user.check_password(new_password):
        raise PasswordReuseNotAllowed()

    validate_password(
        password=new_password,
        user=user,
    )
