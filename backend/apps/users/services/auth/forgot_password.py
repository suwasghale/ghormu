"""
Business logic for requesting a password reset.
"""

from __future__ import annotations

from django.conf import settings
from django.db import transaction

from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.selectors.user import find_user_by_email
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)
from apps.users.services.tokens.password_reset import (
    consume_password_reset_tokens,
    create_password_reset_token,
)
from apps.users.tasks.emails import send_password_reset_email
from core.security.tokens import build_frontend_url

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def forgot_password(
    *,
    email: str,
    created_ip: str | None = None,
    user_agent: str = "",
    request=None,
) -> None:
    """
    Request a password reset.

    Security:
        - Never reveal whether an account exists.
        - Ignore inactive and deleted accounts.
        - Invalidate previous unused tokens.
        - Issue a new password reset token.
        - Queue the email only after the transaction commits.
    """

    user = find_user_by_email(email=email)

    # -------------------------------------------------------------------------
    # Prevent email enumeration. The caller always receives the same
    # response regardless of which branch runs.
    # -------------------------------------------------------------------------

    if user is None or not user.is_active or user.deleted_at is not None:
        return

    consume_password_reset_tokens(user=user)

    result = create_password_reset_token(
        user=user,
        created_ip=created_ip,
        user_agent=user_agent,
    )

    reset_url = build_frontend_url(
        base_url=settings.FRONTEND_PASSWORD_RESET_URL,
        token=result.raw_token,
    )

    # Queued on commit: dispatching inside the transaction lets the
    # worker pick the job up and read the token row before it exists,
    # or send a reset link for a transaction that later rolls back.
    transaction.on_commit(
        lambda: send_password_reset_email.delay(
            recipient=user.email,
            full_name=user.full_name,
            reset_url=reset_url,
        )
    )

    log_security_activity(
        user=user,
        request=request,
        event_type=(SecurityEventTypeChoices.PASSWORD_RESET_REQUESTED),
    )
