"""
The gap between "password accepted" and "signed in".

When a second factor is enabled, login cannot return tokens. It returns
a short-lived challenge ticket instead, which the client exchanges for
tokens by supplying a code.

The ticket lives in the cache rather than in a JWT on purpose. It has to
be revocable the instant it is spent, and a self-contained token cannot
be. Storing only a hash of it means a cache dump does not yield usable
tickets.
"""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from uuid import UUID

from django.conf import settings
from django.core.cache import cache

from apps.users.exceptions.authentication import (
    MFAChallengeInvalid,
)

CACHE_PREFIX = "mfa_challenge"

# Long enough to open an authenticator app, short enough that a stolen
# ticket is worth little. It represents a half-authenticated state, so
# it should not outlive the user's attention.
DEFAULT_TTL_SECONDS = 300

# Bounds guessing of the code itself: a six-digit code is only 10^6
# wide, so an unlimited number of attempts against one ticket is a
# genuine attack rather than a theoretical one.
MAX_ATTEMPTS = 5


@dataclass(slots=True)
class Challenge:
    """
    A pending second-factor step.
    """

    ticket: str
    expires_in: int


def _key(ticket: str) -> str:
    digest = hashlib.sha256(ticket.encode("utf-8")).hexdigest()
    return f"{CACHE_PREFIX}:{digest}"


def _ttl() -> int:
    return getattr(
        settings,
        "MFA_CHALLENGE_TTL_SECONDS",
        DEFAULT_TTL_SECONDS,
    )


def create_challenge(
    *,
    user_id: UUID,
) -> Challenge:
    """
    Issue a ticket representing a completed password check.
    """

    ticket = secrets.token_urlsafe(32)

    cache.set(
        _key(ticket),
        {"user_id": str(user_id), "attempts": 0},
        _ttl(),
    )

    return Challenge(ticket=ticket, expires_in=_ttl())


def resolve_challenge(
    *,
    ticket: str,
) -> UUID:
    """
    Return the user a ticket stands for, counting the attempt.

    Raises:
        MFAChallengeInvalid
    """

    key = _key(ticket)
    payload = cache.get(key)

    if not payload:
        raise MFAChallengeInvalid()

    attempts = payload.get("attempts", 0) + 1

    if attempts > MAX_ATTEMPTS:
        cache.delete(key)
        raise MFAChallengeInvalid()

    # Re-set rather than incr: the value is a dict, and the remaining
    # TTL is deliberately not extended by a failed attempt.
    cache.set(key, {**payload, "attempts": attempts}, _ttl())

    return UUID(payload["user_id"])


def consume_challenge(
    *,
    ticket: str,
) -> None:
    """
    Invalidate a ticket after a successful exchange.
    """

    cache.delete(_key(ticket))
