"""
Email change service.

Responsibilities:
    - Request an email change.
    - Confirm an email change.

Business orchestration only.

This service does not:
    - Generate tokens directly.
    - Hash tokens.
    - Send SMTP emails.
"""

from __future__ import annotations

from urllib.parse import urlencode

from django.conf import settings
from django.db import IntegrityError, transaction

from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import EmailAlreadyInUse
from apps.users.models import User
from apps.users.selectors.user import exists_user_by_email
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)
from apps.users.services.tokens.email_change import (
    consume_email_change_tokens,
    create_email_change_token,
    verify_email_change_token,
)
from apps.users.tasks.emails import (
    send_email_change_verification_email,
)

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def request_email_change(
    *,
    user: User,
    new_email: str,
    created_ip: str | None = None,
    user_agent: str = "",
) -> None:
    """
    Request an email address change.

    Workflow:

        - Ensure the new email is not already in use.
        - Consume previous unused email change tokens.
        - Create a new email change token.
        - Queue the verification email after commit.
    """

    new_email = new_email.strip().lower()

    if user.email.lower() == new_email:
        return

    if exists_user_by_email(email=new_email):
        raise EmailAlreadyInUse()

    consume_email_change_tokens(user=user)

    result = create_email_change_token(
        user=user,
        new_email=new_email,
        created_ip=created_ip,
        user_agent=user_agent,
    )

    verification_url = _build_email_change_url(
        token=result.raw_token,
    )

    transaction.on_commit(
        lambda: send_email_change_verification_email.delay(
            recipient=new_email,
            full_name=user.full_name,
            verification_url=verification_url,
        )
    )


@transaction.atomic
def confirm_email_change(
    *,
    raw_token: str,
    request=None,
) -> User:
    """
    Confirm an email change.

    Workflow:

        - Verify the token.
        - Re-check uniqueness.
        - Update the user's email.
        - Consume all outstanding tokens.
    """

    token = verify_email_change_token(
        raw_token=raw_token,
    )

    user = token.user
    new_email = token.new_email.strip().lower()

    # Re-checked at confirmation time: the address was free when the
    # token was issued, but another account may have claimed it in the
    # interval before the user clicked the link.
    if exists_user_by_email(email=new_email):
        raise EmailAlreadyInUse()

    user.email = new_email
    user.is_verified = True

    try:
        user.save(
            update_fields=[
                "email",
                "is_verified",
                "updated_at",
            ],
        )

    except IntegrityError as exc:
        # Lost the race against a concurrent registration between the
        # check above and this write.
        raise EmailAlreadyInUse() from exc

    consume_email_change_tokens(user=user)

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.EMAIL_CHANGED,
    )

    return user


# =============================================================================
# Helpers
# =============================================================================


def _build_email_change_url(
    *,
    token: str,
) -> str:
    """
    Build the frontend confirmation URL.
    """

    return f"{settings.FRONTEND_EMAIL_CHANGE_URL}?{urlencode({'token': token})}"
