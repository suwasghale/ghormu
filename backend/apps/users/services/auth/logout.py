"""
Logout service.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.choices import RevokeReasonChoices
from apps.users.exceptions.authentication import (
    AuthenticationTokenInvalid,
)
from apps.users.models import User, UserSession
from apps.users.services.auth.jwt import api_settings_jti_claim
from apps.users.services.security.session_state import (
    mark_session_revoked,
)


@transaction.atomic
def logout(
    *,
    refresh_token: str,
    user: User | None = None,
) -> None:
    """
    Blacklist a refresh token and close its session.

    Args:
        refresh_token:
            The refresh token to invalidate.

        user:
            The authenticated user. When supplied, the token must belong
            to them; otherwise an attacker holding any valid refresh
            token could terminate another account's session.

    Raises:
        AuthenticationTokenInvalid
    """

    try:
        refresh = RefreshToken(refresh_token)

    except TokenError as exc:
        raise AuthenticationTokenInvalid() from exc

    # `RefreshToken` exposes no `outstanding_token` attribute; the row
    # has to be looked up by its JTI claim.
    try:
        outstanding = OutstandingToken.objects.get(
            jti=refresh[api_settings_jti_claim()],
        )

    except OutstandingToken.DoesNotExist as exc:
        raise AuthenticationTokenInvalid() from exc

    if user is not None and outstanding.user_id != user.id:
        raise AuthenticationTokenInvalid()

    try:
        refresh.blacklist()

    except TokenError as exc:
        raise AuthenticationTokenInvalid() from exc

    session = UserSession.objects.filter(token=outstanding).first()

    if session is None:
        return

    now = timezone.now()

    UserSession.objects.filter(pk=session.pk).update(
        is_active=False,
        logout_at=now,
        revoked_at=now,
        revoke_reason=RevokeReasonChoices.MANUAL,
    )

    # Make the still-valid access token stop working immediately rather
    # than at its natural expiry.
    transaction.on_commit(
        lambda: mark_session_revoked(session_id=session.id),
    )
