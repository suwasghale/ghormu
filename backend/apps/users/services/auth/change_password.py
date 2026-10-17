"""
Business logic for changing the authenticated user's password.
"""

from __future__ import annotations

from django.conf import settings
from django.db import transaction

from apps.users.choices import RevokeReasonChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.models import User
from apps.users.services.auth.issue_session import (
    IssuedSession,
    issue_session,
)
from apps.users.services.auth.logout_all import logout_all
from apps.users.services.auth.password_validation import (
    validate_current_password,
    validate_new_password,
)
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def change_password(
    *,
    user: User,
    current_password: str,
    new_password: str,
    request=None,
) -> IssuedSession | None:
    """
    Change the authenticated user's password.

    Steps:

    1. Verify the current password.
    2. Validate the new password.
    3. Hash and store it.
    4. Revoke every session.
    5. Issue a fresh session for the caller.

    Step 4 is not optional: leaving sessions alive means an attacker
    holding a stolen token keeps access even though the user believes
    they have locked them out.

    Step 5 exists because ``SIMPLE_JWT["CHECK_REVOKE_TOKEN"]`` embeds a
    hash of the password in every token, so changing it invalidates the
    caller's own credentials too. Rather than silently signing the user
    out of the device they are standing at, a replacement pair is
    returned.

    Returns:
        The replacement session, or None when the caller supplied no
        request (service-to-service use).
    """

    validate_current_password(
        user=user,
        current_password=current_password,
    )

    validate_new_password(
        user=user,
        new_password=new_password,
    )

    user.set_password(new_password)

    user.save(
        update_fields=[
            "password",
            "updated_at",
        ],
    )

    if settings.REVOKE_SESSIONS_ON_PASSWORD_CHANGE:
        logout_all(
            user=user,
            reason=RevokeReasonChoices.PASSWORD_CHANGED,
        )

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.PASSWORD_CHANGED,
    )

    if request is None:
        return None

    return issue_session(
        request=request,
        user=user,
    )
