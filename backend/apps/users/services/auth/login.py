"""
Business service responsible for user authentication.
"""

from __future__ import annotations

from dataclasses import dataclass

from rest_framework.request import Request

from apps.users.choices import SecurityEventStatusChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import (
    EmailNotVerified,
    InvalidCredentials,
    MFARequired,
)
from apps.users.models import User
from apps.users.selectors.user import find_user_by_email
from apps.users.services.auth.issue_session import issue_session
from apps.users.services.auth.jwt import TokenPair
from apps.users.services.auth.lockout import (
    clear_login_failures,
    ensure_not_locked_out,
    record_login_failure,
)
from apps.users.services.auth.mfa import is_mfa_enabled
from apps.users.services.auth.mfa_challenge import create_challenge
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)

# =============================================================================
# DTO
# =============================================================================


@dataclass(slots=True)
class LoginResult:
    """
    Successful authentication result.
    """

    user: User

    tokens: TokenPair


# =============================================================================
# Internal
# =============================================================================


def _burn_password_hash(password: str) -> None:
    """
    Run the configured password hasher and discard the result.

    When no user matches, skipping the hash makes the "unknown email"
    path measurably faster than the "wrong password" path, which is a
    timing oracle for account enumeration. Hashing anyway keeps the two
    paths comparable.

    This mirrors what Django's own ModelBackend does on a user miss.
    """

    User().set_password(password)


# =============================================================================
# Public API
# =============================================================================


def login(
    *,
    request: Request,
    email: str,
    password: str,
) -> LoginResult:
    """
    Authenticate a user.

    Order of operations is security relevant:

    1. Lockout check, so a locked account cannot be probed further.
    2. Password verification, which gates everything below it.
    3. Account state checks, which are only safe to disclose to a caller
       that has already proven it knows the password.

    Every failure before step 3 raises the same ``InvalidCredentials``
    so the endpoint cannot be used to discover which addresses are
    registered or what state they are in.
    """

    email = email.strip().lower()

    ensure_not_locked_out(email=email)

    user = find_user_by_email(email=email)

    # ------------------------------------------------------------------
    # Password verification
    # ------------------------------------------------------------------

    if user is None:
        _burn_password_hash(password)
        record_login_failure(email=email)
        raise InvalidCredentials()

    if not user.check_password(password):
        record_login_failure(email=email)

        log_security_activity(
            user=user,
            request=request,
            event_type=SecurityEventTypeChoices.LOGIN_FAILED,
            status=SecurityEventStatusChoices.FAILED,
        )

        raise InvalidCredentials()

    # ------------------------------------------------------------------
    # Account state
    #
    # Reached only with a valid password, so these messages disclose
    # nothing the caller does not already know.
    # ------------------------------------------------------------------

    if user.deleted_at is not None or not user.is_active:
        record_login_failure(email=email)
        raise InvalidCredentials()

    if not user.is_verified:
        raise EmailNotVerified()

    # ------------------------------------------------------------------
    # Second factor
    #
    # Tokens are withheld until the code is supplied. Returning them
    # here and "checking MFA later" would make the second factor
    # advisory - a client that ignored the flag would be fully signed
    # in.
    #
    # The failure counter is deliberately NOT cleared on this path. A
    # correct password is only half the login, and clearing here would
    # reset the budget on every attempt - leaving code guessing bounded
    # only by the per-ticket limit, which an attacker escapes simply by
    # requesting a new ticket. `complete_mfa_login` clears it once the
    # second factor actually passes.
    # ------------------------------------------------------------------

    if is_mfa_enabled(user=user):
        challenge = create_challenge(user_id=user.id)

        raise MFARequired(
            errors={
                "mfa_ticket": challenge.ticket,
                "expires_in": challenge.expires_in,
            },
        )

    clear_login_failures(email=email)

    issued = issue_session(
        request=request,
        user=user,
    )

    return LoginResult(
        user=issued.user,
        tokens=issued.tokens,
    )
