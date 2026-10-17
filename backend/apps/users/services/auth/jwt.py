"""
JWT token services.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User

SESSION_ID_CLAIM = "session_id"


# =============================================================================
# DTO
# =============================================================================


@dataclass(slots=True)
class TokenPair:
    """
    A freshly minted access/refresh pair and its database record.
    """

    access: str
    refresh: str

    refresh_token: RefreshToken
    outstanding_token: OutstandingToken

    def bind_session(
        self,
        *,
        session_id: UUID | str,
    ) -> None:
        """
        Attach a session identifier to both tokens and re-encode them.

        The claim is what lets the authentication layer check an access
        token against the session revocation list. Mutating the claim
        does not change the token's ``jti``, so the existing
        OutstandingToken row still matches.
        """

        self.refresh_token[SESSION_ID_CLAIM] = str(session_id)

        access = self.refresh_token.access_token
        access[SESSION_ID_CLAIM] = str(session_id)

        self.refresh = str(self.refresh_token)
        self.access = str(access)


# =============================================================================
# Public API
# =============================================================================


def create_token_pair(
    *,
    user: User,
) -> TokenPair:
    """
    Issue a fresh JWT token pair.

    Simple JWT writes the OutstandingToken row as a side effect of
    ``for_user`` when the blacklist app is installed, so the row is
    fetched rather than created here.
    """

    refresh = RefreshToken.for_user(user)

    outstanding = OutstandingToken.objects.get(
        jti=refresh[api_settings_jti_claim()],
    )

    return TokenPair(
        access=str(refresh.access_token),
        refresh=str(refresh),
        refresh_token=refresh,
        outstanding_token=outstanding,
    )


def api_settings_jti_claim() -> str:
    """
    Return the configured JTI claim name.

    Read from settings rather than hardcoded so that changing
    ``SIMPLE_JWT["JTI_CLAIM"]`` does not silently break token lookups.
    """

    from rest_framework_simplejwt.settings import api_settings

    return api_settings.JTI_CLAIM


def create_access_token(
    *,
    refresh_token: RefreshToken,
) -> str:
    """
    Derive a new access token from an existing refresh token.
    """

    return str(refresh_token.access_token)


def revoke_refresh_token(
    *,
    refresh_token: RefreshToken,
) -> None:
    """
    Blacklist a refresh token.
    """

    refresh_token.blacklist()
