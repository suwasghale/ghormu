"""
Business services for User.

Services contain business logic only.

They are responsible for creating, updating and mutating User
objects. Read operations belong in selectors.
"""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.utils import timezone

from apps.users.models import User

# =============================================================================
# Verification
# =============================================================================


def verify_user(
    *,
    user: User,
) -> User:
    """
    Mark a user's email address as verified.

    If the user is already verified, nothing is changed.
    """
    if user.is_verified:
        return user

    user.is_verified = True
    user.save(update_fields=["is_verified", "updated_at"])

    return user


# =============================================================================
# Activation
# =============================================================================


def activate_user(
    *,
    user: User,
) -> User:
    """
    Activate a user account.
    """
    if user.is_active:
        return user

    user.is_active = True
    user.save(update_fields=["is_active", "updated_at"])

    return user


def deactivate_user(
    *,
    user: User,
) -> User:
    """
    Deactivate a user account.
    """
    if not user.is_active:
        return user

    user.is_active = False
    user.save(update_fields=["is_active", "updated_at"])

    return user


# =============================================================================
# Password
# =============================================================================


def change_password(
    *,
    user: User,
    password: str,
    validate: bool = True,
) -> User:
    """
    Change a user's password.

    Args:
        user:
            User instance.

        password:
            New raw password.

        validate:
            Whether Django password validators should be executed.
    """
    if validate:
        validate_password(password, user)

    user.set_password(password)

    user.save(update_fields=["password", "updated_at"])

    return user


def set_unusable_password(
    *,
    user: User,
) -> User:
    """
    Remove the ability to authenticate using a password.
    """
    user.set_unusable_password()

    user.save(update_fields=["password", "updated_at"])

    return user


# =============================================================================
# Email
# =============================================================================


def change_email(
    *,
    user: User,
    email: str,
    verified: bool = False,
) -> User:
    """
    Change a user's email address.

    By default, changing the email invalidates verification.
    """
    user.email = email
    user.is_verified = verified

    user.save(
        update_fields=[
            "email",
            "is_verified",
            "updated_at",
        ]
    )

    return user


# =============================================================================
# Activity
# =============================================================================


def update_last_seen(
    *,
    user: User,
) -> User:
    """
    Update the user's last activity timestamp.
    """
    user.last_seen = timezone.now()

    user.save(
        update_fields=[
            "last_seen",
            "updated_at",
        ]
    )

    return user


# =============================================================================
# Staff
# =============================================================================


def grant_staff(
    *,
    user: User,
) -> User:
    """
    Grant staff privileges.
    """
    if user.is_staff:
        return user

    user.is_staff = True

    user.save(
        update_fields=[
            "is_staff",
            "updated_at",
        ]
    )

    return user


def revoke_staff(
    *,
    user: User,
) -> User:
    """
    Remove staff privileges.
    """
    if not user.is_staff:
        return user

    user.is_staff = False

    user.save(
        update_fields=[
            "is_staff",
            "updated_at",
        ]
    )

    return user
