"""
JWT refresh service.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken

from apps.users.choices import RevokeReasonChoices
from apps.users.exceptions.authentication import (
    AuthenticationTokenInvalid,
    InvalidCredentials,
    RefreshTokenReuseDetected,
)
from apps.users.models import UserSession
from apps.users.services.auth.jwt import (
    TokenPair,
    api_settings_jti_claim,
)
from apps.users.services.auth.logout_all import logout_all
from apps.users.services.security.session_state import (
    is_session_active,
)

# =============================================================================
# DTO
# =============================================================================


@dataclass(slots=True)
class RefreshResult:
    """
    Result of a successful refresh.
    """

    tokens: TokenPair
    session: UserSession


# =============================================================================
# Public API
# =============================================================================


def refresh_tokens(
    *,
    refresh: str,
) -> RefreshResult:
    """
    Rotate a refresh token.

    Deliberately NOT wrapped in a transaction as a whole. The reuse
    branch has to commit its revocation and then raise; if the raise
    happened inside the atomic block the rollback would undo the very
    revocation the exception is reporting, leaving every stolen session
    alive while telling the caller they had been terminated.

    Workflow

        1. Validate the refresh token.
        2. Detect reuse - revoke everything and stop.
        3. Rotate atomically.
    """

    jti_claim = api_settings_jti_claim()

    # ------------------------------------------------------------------
    # Decode without the blacklist check
    #
    # Constructing a RefreshToken runs BlacklistMixin.verify(), which
    # raises "Token is blacklisted" before any of our code sees the
    # token. Reuse would therefore be indistinguishable from a garbage
    # token and the revoke-on-theft response could never fire.
    #
    # UntypedToken carries no BlacklistMixin, so it validates the
    # signature, expiry, audience and issuer while leaving the blacklist
    # decision to us.
    # ------------------------------------------------------------------

    try:
        decoded = UntypedToken(refresh)

    except TokenError as exc:
        raise AuthenticationTokenInvalid() from exc

    # UntypedToken deliberately skips this check, so a caller could
    # otherwise present an access token where a refresh token belongs.
    if decoded.get(api_settings.TOKEN_TYPE_CLAIM) != "refresh":
        raise AuthenticationTokenInvalid()

    jti = decoded[jti_claim]

    # ------------------------------------------------------------------
    # Reuse detection
    #
    # Runs outside a transaction so the revocation it performs is
    # committed before the exception below unwinds the stack. Raising
    # inside an atomic block would roll the revocation back, leaving
    # every stolen session alive while telling the caller otherwise.
    # ------------------------------------------------------------------

    if _is_reused(jti=jti):
        _revoke_after_reuse(jti=jti)
        raise RefreshTokenReuseDetected()

    try:
        old_refresh = RefreshToken(refresh)

    except TokenError as exc:
        raise AuthenticationTokenInvalid() from exc

    return _rotate(
        old_refresh=old_refresh,
        jti=jti,
        jti_claim=jti_claim,
    )


# =============================================================================
# Internal
# =============================================================================


def _is_reused(*, jti: str) -> bool:
    """
    Return whether this refresh token has already been rotated.
    """

    return BlacklistedToken.objects.filter(
        token__jti=jti,
    ).exists()


def _revoke_after_reuse(*, jti: str) -> None:
    """
    Tear down every session belonging to the owner of a replayed token.
    """

    outstanding = (
        OutstandingToken.objects.select_related("user").filter(jti=jti).first()
    )

    if outstanding is None:
        return

    logout_all(
        user=outstanding.user,
        reason=RevokeReasonChoices.TOKEN_REUSE,
    )


@transaction.atomic
def _rotate(
    *,
    old_refresh: RefreshToken,
    jti: str,
    jti_claim: str,
) -> RefreshResult:
    """
    Blacklist the presented token and issue its successor.
    """

    # ------------------------------------------------------------------
    # Find and lock the OutstandingToken
    #
    # Locked so two concurrent refreshes of the same token serialise:
    # without it both could pass the reuse check and each mint a valid
    # successor, forking the session.
    # ------------------------------------------------------------------

    try:
        outstanding = (
            OutstandingToken.objects
            # `of` confines the lock to this table. OutstandingToken.user
            # is nullable, so select_related("user") joins with a LEFT
            # OUTER JOIN and Postgres rejects a plain FOR UPDATE over it:
            #
            #   NotSupportedError: FOR UPDATE cannot be applied to the
            #   nullable side of an outer join
            #
            # SQLite has no row locking and drops the clause entirely,
            # which is why this only surfaced once the suite ran against
            # Postgres — in production every refresh returned 500.
            .select_for_update(of=("self",))
            .select_related("user")
            .get(jti=jti)
        )

    except OutstandingToken.DoesNotExist as exc:
        raise AuthenticationTokenInvalid() from exc

    # Re-checked under the lock: a concurrent request may have rotated
    # this token between the check outside the transaction and here.
    if BlacklistedToken.objects.filter(token=outstanding).exists():
        raise AuthenticationTokenInvalid()

    # ------------------------------------------------------------------
    # Verify the account is still usable
    # ------------------------------------------------------------------

    user = outstanding.user

    if not user.is_active or user.deleted_at is not None:
        raise InvalidCredentials()

    # ------------------------------------------------------------------
    # Locate the session
    # ------------------------------------------------------------------

    session = UserSession.objects.select_for_update().filter(token=outstanding).first()

    if session is None:
        # A token with no session can never be revoked through the
        # sessions API. Refuse it rather than raise DoesNotExist.
        raise AuthenticationTokenInvalid()

    if not session.is_active or not is_session_active(
        session_id=session.id,
    ):
        raise AuthenticationTokenInvalid()

    # ------------------------------------------------------------------
    # Rotate
    # ------------------------------------------------------------------

    old_refresh.blacklist()

    new_refresh = RefreshToken.for_user(user)

    new_outstanding = OutstandingToken.objects.get(
        jti=new_refresh[jti_claim],
    )

    session.token = new_outstanding
    session.last_activity = timezone.now()

    session.save(
        update_fields=[
            "token",
            "last_activity",
        ],
    )

    tokens = TokenPair(
        access="",
        refresh="",
        refresh_token=new_refresh,
        outstanding_token=new_outstanding,
    )

    tokens.bind_session(session_id=session.id)

    return RefreshResult(
        session=session,
        tokens=tokens,
    )
