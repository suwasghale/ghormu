"""
Social sign-in seam.

The provider-specific part of OAuth is small and the risky part is
shared, so this defines the shared half and leaves each provider to
supply three things: how to build an authorisation URL, how to exchange
a code, and how to normalise the profile that comes back.

What the shared half enforces - and what implementations routinely get
wrong:

1. **The state parameter is mandatory.** Without it, an attacker can
   complete their own authorisation and feed the resulting code to a
   victim's browser, linking the victim's session to the attacker's
   account. State is generated server-side, stored, and required to
   match.

2. **An unverified provider email is not proof of ownership.** Several
   providers will hand back an address the user never confirmed. Trusting
   it lets anyone who can create an account at that provider claim the
   matching local account. Providers declare whether they verify, and
   `email_verified` is honoured.

3. **Linking is not the same as signing in.** Matching on email alone
   silently merges accounts. This seam creates or links only when the
   provider's address is verified; otherwise the caller must go through
   an explicit confirmation step.
"""

from __future__ import annotations

import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass

from django.core.cache import cache

STATE_PREFIX = "oauth_state"

STATE_TTL_SECONDS = 600


# ------------------------------------------------------------------------------
# DTOs
# ------------------------------------------------------------------------------


@dataclass(slots=True)
class SocialProfile:
    """
    A provider's answer, normalised.
    """

    provider: str

    # Stable identifier at the provider. The thing to key on - an email
    # address can change hands, this cannot.
    subject: str

    email: str | None

    # Whether the provider states it has verified the address. Never
    # assume True.
    email_verified: bool = False

    first_name: str = ""
    last_name: str = ""
    avatar_url: str = ""
    raw: dict | None = None


@dataclass(slots=True)
class AuthorizationRequest:
    """
    Where to send the user, and the state to expect back.
    """

    authorization_url: str
    state: str


# ------------------------------------------------------------------------------
# Provider contract
# ------------------------------------------------------------------------------


class SocialProvider(ABC):
    """
    One OAuth/OIDC provider.

    Subclass, set `name`, implement the three methods, and register it.
    """

    name: str = ""

    #: Whether this provider's `email_verified` claim can be trusted at
    #: all. A provider that never verifies addresses should set False,
    #: and accounts from it are never auto-linked.
    verifies_email: bool = False

    @abstractmethod
    def build_authorization_url(
        self,
        *,
        state: str,
        redirect_uri: str,
    ) -> str:
        """
        Return the URL to send the user to.
        """

    @abstractmethod
    def exchange_code(
        self,
        *,
        code: str,
        redirect_uri: str,
    ) -> dict:
        """
        Exchange an authorisation code for tokens.
        """

    @abstractmethod
    def fetch_profile(
        self,
        *,
        tokens: dict,
    ) -> SocialProfile:
        """
        Turn a token response into a normalised profile.
        """


# ------------------------------------------------------------------------------
# Registry
# ------------------------------------------------------------------------------

_REGISTRY: dict[str, SocialProvider] = {}


def register_provider(provider: SocialProvider) -> None:
    """
    Make a provider available to the social endpoints.
    """

    if not provider.name:
        raise ValueError("A social provider needs a name.")

    _REGISTRY[provider.name] = provider


def get_provider(name: str) -> SocialProvider | None:
    """
    Return a registered provider, or None.
    """

    return _REGISTRY.get(name)


def available_providers() -> list[str]:
    """
    Names of every configured provider.
    """

    return sorted(_REGISTRY)


# ------------------------------------------------------------------------------
# State
# ------------------------------------------------------------------------------


def issue_state(*, provider: str, redirect_uri: str) -> str:
    """
    Create a single-use state value bound to this authorisation attempt.
    """

    state = secrets.token_urlsafe(32)

    cache.set(
        f"{STATE_PREFIX}:{state}",
        {"provider": provider, "redirect_uri": redirect_uri},
        STATE_TTL_SECONDS,
    )

    return state


def consume_state(*, state: str) -> dict | None:
    """
    Validate and spend a state value.

    Single use: replaying it must not work, or the CSRF protection it
    provides is only advisory.
    """

    key = f"{STATE_PREFIX}:{state}"

    payload = cache.get(key)

    if payload is not None:
        cache.delete(key)

    return payload
