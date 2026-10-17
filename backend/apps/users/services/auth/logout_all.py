"""
Logout from every device.

Blacklists every outstanding refresh token belonging to the user and
closes every session in bulk.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)

from apps.users.choices import RevokeReasonChoices
from apps.users.models import User, UserSession
from apps.users.services.security.session_state import (
    mark_sessions_revoked,
)


@transaction.atomic
def logout_all(
    *,
    user: User,
    reason: str = RevokeReasonChoices.MANUAL,
    keep_session_id=None,
) -> int:
    """
    Log the user out of every device.

    The previous implementation looped over every outstanding token and
    issued a get_or_create plus a session lookup plus a save for each
    one, which is three queries per token. This does it in a fixed
    number of queries regardless of how many tokens exist.

    Args:
        user:
            Owner of the sessions.

        reason:
            Recorded on each closed session for auditing.

        keep_session_id:
            Optional session to leave alive, used by "log out my other
            devices" flows so the caller is not logged out too.

    Returns:
        Number of sessions closed.
    """

    now = timezone.now()

    # ------------------------------------------------------------------
    # Blacklist refresh tokens
    # ------------------------------------------------------------------

    outstanding = OutstandingToken.objects.filter(user=user)

    if keep_session_id is not None:
        kept_token_ids = UserSession.objects.filter(
            user=user,
            id=keep_session_id,
        ).values_list("token_id", flat=True)
        outstanding = outstanding.exclude(id__in=kept_token_ids)

    already_blacklisted = set(
        BlacklistedToken.objects.filter(token__user=user).values_list(
            "token_id", flat=True
        )
    )

    BlacklistedToken.objects.bulk_create(
        [
            BlacklistedToken(token_id=token_id)
            for token_id in outstanding.values_list("id", flat=True)
            if token_id not in already_blacklisted
        ],
        ignore_conflicts=True,
    )

    # ------------------------------------------------------------------
    # Close sessions
    # ------------------------------------------------------------------

    sessions = UserSession.objects.filter(
        user=user,
        is_active=True,
    )

    if keep_session_id is not None:
        sessions = sessions.exclude(id=keep_session_id)

    session_ids = list(sessions.values_list("id", flat=True))

    if not session_ids:
        return 0

    UserSession.objects.filter(id__in=session_ids).update(
        is_active=False,
        logout_at=now,
        revoked_at=now,
        revoke_reason=reason,
    )

    # Invalidate the outstanding access tokens as soon as the rows are
    # durable, so a rolled-back transaction cannot revoke live sessions.
    transaction.on_commit(
        lambda: mark_sessions_revoked(session_ids=session_ids),
    )

    return len(session_ids)
