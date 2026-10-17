"""
Session issuance.

Shared by every flow that needs to hand a client a working token pair:
login, and password change (which necessarily invalidates the pair the
caller arrived with).
"""

from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction

from apps.users.choices import LoginMethodChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.models import User
from apps.users.services.auth.jwt import TokenPair, create_token_pair
from apps.users.services.security.create_session import create_session
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)


@dataclass(slots=True)
class IssuedSession:
    """
    A token pair and the session backing it.
    """

    user: User
    tokens: TokenPair


@transaction.atomic
def issue_session(
    *,
    request,
    user: User,
    login_method: str = LoginMethodChoices.PASSWORD,
    event_type: str = SecurityEventTypeChoices.LOGIN,
    mfa_verified: bool = False,
) -> IssuedSession:
    """
    Mint a token pair and its backing session record.

    Wrapped in a transaction so a failure part way through cannot leave
    an outstanding token without a session - such a token would
    authenticate requests but could never be revoked through the
    sessions API.
    """

    tokens = create_token_pair(user=user)

    session = create_session(
        request=request,
        user=user,
        outstanding_token=tokens.outstanding_token,
        login_method=login_method,
        mfa_verified=mfa_verified,
    )

    # Bind both tokens to the session so every authenticated request can
    # be checked against the revocation list.
    tokens.bind_session(session_id=session.id)

    log_security_activity(
        user=user,
        session=session,
        request=request,
        event_type=event_type,
    )

    return IssuedSession(
        user=user,
        tokens=tokens,
    )
