"""
Permission classes that depend on the users app.

`core.api.permissions` holds the app-agnostic ones. Anything that has
to import a model from here lives in this module instead, so core/
stays reusable on its own.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsMFAVerified(BasePermission):
    """
    Require that the current session completed a second factor.

    For high-value operations where holding a session should not be
    enough on its own - changing payout details, say.

    Users without MFA enabled pass: this asks "was this session
    MFA-verified", not "does this user have MFA". Combine with a check
    on `is_mfa_enabled` if enrolment itself must be mandatory.
    """

    message = "This action requires two-factor verification."

    def has_permission(self, request, view) -> bool:
        from apps.users.models import UserSession
        from apps.users.services.auth.mfa import is_mfa_enabled

        user = request.user

        if not (user and user.is_authenticated):
            return False

        if not is_mfa_enabled(user=user):
            return True

        auth = getattr(request, "auth", None)

        if auth is None:
            return False

        try:
            session_id = auth.get("session_id")
        except AttributeError:
            return False

        if not session_id:
            return False

        return UserSession.objects.filter(
            id=session_id,
            mfa_verified=True,
        ).exists()
