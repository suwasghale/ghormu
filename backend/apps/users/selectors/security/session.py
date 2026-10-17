"""
Selectors for user sessions.
"""

from __future__ import annotations

from uuid import UUID

from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.users.models import User, UserSession


def get_session_by_token(
    *,
    token: OutstandingToken,
) -> UserSession | None:
    """
    Return the session associated with an outstanding token.
    """

    return (
        UserSession.objects.select_related("token", "user")
        .filter(
            token=token,
        )
        .first()
    )


def get_session_by_jti(
    *,
    jti: str,
) -> UserSession | None:
    """
    Return a session by JWT JTI.
    """

    return (
        UserSession.objects.select_related(
            "token",
        )
        .filter(
            token__jti=jti,
            is_active=True,
        )
        .first()
    )


def get_user_session_by_id(
    *,
    user: User,
    session_id: UUID,
) -> UserSession | None:
    """
    Return one trusted device.
    """

    return UserSession.objects.filter(
        id=session_id,
        user=user,
        is_active=True,
    ).first()
