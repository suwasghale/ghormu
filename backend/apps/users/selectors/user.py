"""
Selectors related to the User model.

Selectors are responsible ONLY for reading data.

They never create, update or delete records.
"""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from apps.users.models import User

# =============================================================================
# Single Objects
# =============================================================================


def get_user_by_id(
    *,
    user_id: UUID,
) -> User:
    """
    Return a user by primary key.

    No related objects are joined: CurrentUserSerializer renders
    identity only. Callers that need the profile use the profiles app's
    own selectors.

    Raises:
        User.DoesNotExist
    """
    return User.objects.get(pk=user_id)


def find_user_by_email(
    *,
    email: str,
) -> User | None:
    """
    Return a user by email.

    Uses an exact match against the normalized (lowercased) address
    rather than `iexact`. `iexact` compiles to UPPER(email) = UPPER(%s),
    which cannot use the unique index and degrades into a sequential
    scan - on the login path, on every attempt.

    Returns:
        User | None
    """
    return User.objects.filter(email=email.strip().lower()).first()


# =============================================================================
# Lists
# =============================================================================


def list_users() -> QuerySet[User]:
    """
    Return every user.
    """
    return User.objects.order_by("-created_at")


def list_active_users() -> QuerySet[User]:
    """
    Return active users.
    """
    return User.objects.filter(is_active=True).order_by("-created_at")


def list_verified_users() -> QuerySet[User]:
    """
    Return verified users.
    """
    return User.objects.filter(
        is_active=True,
        is_verified=True,
    ).order_by("-created_at")


def list_staff_users() -> QuerySet[User]:
    """
    Return staff users.
    """
    return User.objects.filter(is_staff=True).order_by("email")


# =============================================================================
# Boolean
# =============================================================================


def exists_user_by_email(
    *,
    email: str,
) -> bool:
    """
    Return whether a user exists with the given email.
    """
    return User.objects.filter(email=email.strip().lower()).exists()
