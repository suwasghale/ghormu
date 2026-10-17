"""
Authentication classes.

Lives in the users app rather than core/ because it depends on
UserSession and the session-state cache. Putting it in core/ would
make the shared foundation depend on an application, which is the
wrong direction and would stop core/ being reusable on its own.

``SessionAwareJWTAuthentication`` extends Simple JWT's stateless
authentication with server-side session awareness.

Stock ``JWTAuthentication`` only verifies the signature, the expiry and
``user.is_active``. Nothing consults the session table, so logging out,
revoking a device or resetting a password leaves every already-issued
access token working until it expires. For a 15 minute access token that
is a 15 minute window in which "revoke this device" does nothing.

This class closes that window by checking the ``session_id`` claim
against the session state cache on every request, and refreshes the
session's activity timestamp at most once per interval.
"""

from __future__ import annotations

from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed,
    InvalidToken,
)

from apps.users.services.security.session_state import (
    is_session_active,
    should_record_activity,
)

SESSION_ID_CLAIM = "session_id"


class SessionAwareJWTAuthentication(JWTAuthentication):
    """
    JWT authentication bound to a server-side session record.
    """

    def get_user(self, validated_token):
        """
        Resolve the user and enforce session validity.

        Runs after the token's signature and expiry have been verified.
        """

        user = super().get_user(validated_token)

        session_id = validated_token.get(SESSION_ID_CLAIM)

        if not session_id:
            if getattr(
                settings,
                "JWT_REQUIRE_SESSION_CLAIM",
                True,
            ):
                raise InvalidToken(
                    "Token is not bound to a session.",
                )

            return user

        if not is_session_active(session_id=session_id):
            raise AuthenticationFailed(
                "This session has been revoked.",
                code="session_revoked",
            )

        self._touch_session(session_id)

        return user

    # --------------------------------------------------------------------------
    # Activity tracking
    # --------------------------------------------------------------------------

    @staticmethod
    def _touch_session(session_id) -> None:
        """
        Refresh the session's activity timestamp.

        Rate limited through the cache so that a burst of requests
        produces a single UPDATE rather than one per request. Uses a
        queryset update to avoid loading the row and to bypass model
        save() side effects.
        """

        if not should_record_activity(session_id=session_id):
            return

        from apps.users.models import UserSession

        (UserSession.objects.filter(id=session_id).update(last_activity=timezone.now()))
