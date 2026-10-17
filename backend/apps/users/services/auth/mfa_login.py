"""
Completing a login that was interrupted by the second factor.
"""

from __future__ import annotations

from apps.users.choices import SecurityEventStatusChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import (
    InvalidCredentials,
    InvalidOTP,
)
from apps.users.selectors.user import get_user_by_id
from apps.users.services.auth.issue_session import issue_session
from apps.users.services.auth.lockout import (
    clear_login_failures,
    ensure_not_locked_out,
    record_login_failure,
)
from apps.users.services.auth.login import LoginResult
from apps.users.services.auth.mfa import verify_mfa_code
from apps.users.services.auth.mfa_challenge import (
    consume_challenge,
    resolve_challenge,
)
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)


def complete_mfa_login(
    *,
    request,
    ticket: str,
    code: str,
) -> LoginResult:
    """
    Exchange a challenge ticket plus a code for a session.

    Raises:
        MFAChallengeInvalid, InvalidOTP, InvalidCredentials
    """

    user_id = resolve_challenge(ticket=ticket)

    user = get_user_by_id(user_id=user_id)

    # The account may have been disabled between the password step and
    # this one.
    if not user.is_active or user.deleted_at is not None:
        consume_challenge(ticket=ticket)
        raise InvalidCredentials()

    # Codes count against the same lockout budget as passwords: without
    # this, a six-digit code is only 10^6 wide and the ticket rotation
    # alone would not bound guessing across tickets.
    ensure_not_locked_out(email=user.email)

    if not verify_mfa_code(user=user, code=code):
        record_login_failure(email=user.email)

        log_security_activity(
            user=user,
            request=request,
            event_type=SecurityEventTypeChoices.LOGIN_FAILED,
            status=SecurityEventStatusChoices.FAILED,
            metadata={"stage": "mfa"},
        )

        raise InvalidOTP()

    consume_challenge(ticket=ticket)
    clear_login_failures(email=user.email)

    issued = issue_session(
        request=request,
        user=user,
        mfa_verified=True,
    )

    return LoginResult(user=issued.user, tokens=issued.tokens)
