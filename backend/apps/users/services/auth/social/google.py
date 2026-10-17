"""
Google as a worked example of the provider contract.

Registered at startup only when it is configured. A provider that ships
enabled-but-unconfigured would fail at runtime with a confusing error;
setting only one of the two credentials fails the `users.E001` system
check instead.

To enable:

1. Create an OAuth client in the Google Cloud console.
2. Register `<frontend origin>/auth/callback/google` as an authorized
   redirect URI.
3. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.

The frontend shows "Continue with Google" whenever the provider is
listed by `GET /auth/social/`.

Google is an OIDC provider and does verify addresses, so
`verifies_email` is True and its `email_verified` claim is honoured.
"""

from __future__ import annotations

from urllib.parse import urlencode

import httpx
from django.conf import settings

from apps.users.services.auth.social.base import (
    SocialProfile,
    SocialProvider,
)

AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
# noqa on the next line: ruff flags any name containing "TOKEN"
# as a possible hardcoded secret. This is a public URL.
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"  # noqa: S105
USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"

REQUEST_TIMEOUT = 10


class GoogleProvider(SocialProvider):
    """
    Google OIDC.
    """

    name = "google"
    verifies_email = True

    # --------------------------------------------------------------------------
    # Configuration
    # --------------------------------------------------------------------------

    @property
    def client_id(self) -> str:
        return settings.GOOGLE_OAUTH_CLIENT_ID

    @property
    def client_secret(self) -> str:
        return settings.GOOGLE_OAUTH_CLIENT_SECRET

    # --------------------------------------------------------------------------
    # Contract
    # --------------------------------------------------------------------------

    def build_authorization_url(
        self,
        *,
        state: str,
        redirect_uri: str,
    ) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            # Forces the account chooser rather than silently reusing
            # whichever Google account the browser last used.
            "prompt": "select_account",
        }

        return f"{AUTHORIZATION_ENDPOINT}?{urlencode(params)}"

    def exchange_code(
        self,
        *,
        code: str,
        redirect_uri: str,
    ) -> dict:
        response = httpx.post(
            TOKEN_ENDPOINT,
            data={
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=REQUEST_TIMEOUT,
        )

        response.raise_for_status()

        return response.json()

    def fetch_profile(
        self,
        *,
        tokens: dict,
    ) -> SocialProfile:
        response = httpx.get(
            USERINFO_ENDPOINT,
            headers={
                "Authorization": f"Bearer {tokens['access_token']}",
            },
            timeout=REQUEST_TIMEOUT,
        )

        response.raise_for_status()

        data = response.json()

        return SocialProfile(
            provider=self.name,
            subject=data["sub"],
            email=data.get("email"),
            # Honoured rather than assumed. Google sets this False for
            # addresses it has not confirmed.
            email_verified=bool(data.get("email_verified", False)),
            first_name=data.get("given_name", ""),
            last_name=data.get("family_name", ""),
            avatar_url=data.get("picture", ""),
            raw=data,
        )


def is_configured() -> bool:
    return bool(
        settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET,
    )


def register_if_configured() -> None:
    """
    Register Google when both credentials are present.
    """

    if is_configured():
        from apps.users.services.auth.social.base import register_provider

        register_provider(GoogleProvider())
