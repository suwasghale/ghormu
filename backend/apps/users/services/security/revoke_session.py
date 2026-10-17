"""
Service for revoking a user session.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
)

from apps.users.choices import RevokeReasonChoices
from apps.users.models import UserSession
from apps.users.services.security.session_state import (
    mark_session_revoked,
)

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def revoke_session(
    *,
    session: UserSession,
    reason: str = RevokeReasonChoices.MANUAL,
) -> UserSession:
    """
    Revoke an active session.

    Blacklisting the refresh token alone is not enough: the access token
    derived from it stays cryptographically valid until it expires. The
    session is therefore also marked revoked in the state cache, which
    the authentication layer consults on every request.
    """

    if session.token_id:
        BlacklistedToken.objects.get_or_create(
            token_id=session.token_id,
        )

    now = timezone.now()

    session.is_active = False
    session.logout_at = now
    session.revoked_at = now
    session.revoke_reason = reason

    session.save(
        update_fields=[
            "is_active",
            "logout_at",
            "revoked_at",
            "revoke_reason",
        ],
    )

    transaction.on_commit(
        lambda: mark_session_revoked(session_id=session.id),
    )

    return session
