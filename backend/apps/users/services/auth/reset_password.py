"""
Password reset service.

Responsibilities:
    - Verify a password reset token.
    - Change the user's password.
    - Consume every remaining password reset token.
    - Revoke every existing session.

This service does not:
    - Generate tokens.
    - Send emails.
"""

from __future__ import annotations

from django.conf import settings
from django.db import transaction

from apps.users.choices import RevokeReasonChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.models import User
from apps.users.services.auth.logout_all import logout_all
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)
from apps.users.services.tokens.password_reset import (
    consume_password_reset_tokens,
    verify_password_reset_token,
)
from apps.users.services.user import change_password


@transaction.atomic
def reset_password(
    *,
    raw_token: str,
    new_password: str,
    request=None,
) -> User:
    """
    Reset a user's password.

    Workflow:

        1. Verify the reset token.
        2. Update the user's password.
        3. Consume every remaining password reset token.
        4. Revoke every session.

    Step 4 is the point of the reset. A user resetting their password
    has usually lost control of the account or suspects they have; if
    the attacker's tokens survive the reset, nothing has been achieved.

    Raises:
        PasswordResetTokenInvalid
    """

    token = verify_password_reset_token(
        raw_token=raw_token,
    )

    user = token.user

    change_password(
        user=user,
        password=new_password,
    )

    consume_password_reset_tokens(
        user=user,
    )

    if settings.REVOKE_SESSIONS_ON_PASSWORD_CHANGE:
        logout_all(
            user=user,
            reason=RevokeReasonChoices.PASSWORD_CHANGED,
        )

    log_security_activity(
        user=user,
        request=request,
        event_type=(SecurityEventTypeChoices.PASSWORD_RESET_COMPLETED),
    )

    return user
