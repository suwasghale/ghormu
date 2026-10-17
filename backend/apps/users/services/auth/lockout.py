"""
Per-account login lockout.

DRF's throttles key on the client IP, which a distributed attacker
sidesteps by rotating source addresses. Counting failures against the
targeted account closes that gap: no matter how many hosts an attacker
controls, a single account only tolerates a bounded number of guesses
per window.

Counters live in the cache rather than the database so a credential
stuffing run does not generate write load on the users table.

The account identifier is hashed before being used as a cache key so
that raw email addresses are not written into Redis, where they would
be visible to anyone able to inspect the keyspace.
"""

from __future__ import annotations

import hashlib
from functools import wraps

from django.conf import settings
from django.core.cache import caches
from redis.exceptions import RedisError

from apps.users.exceptions.authentication import (
    AccountLockedOut,
    AuthenticationUnavailable,
)


def _cache():
    # Test settings use one isolated LocMem backend; production has a strict alias.
    return caches["security" if "security" in settings.CACHES else "default"]


def _require_security_cache(function):
    @wraps(function)
    def guarded(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except (RedisError, OSError) as exc:
            raise AuthenticationUnavailable(headers={"Retry-After": "30"}) from exc

    return guarded


CACHE_PREFIX = "login_failures"
LOCK_PREFIX = "login_locked"


# ------------------------------------------------------------------------------
# Keys
# ------------------------------------------------------------------------------


def _fingerprint(email: str) -> str:
    return hashlib.sha256(
        email.strip().lower().encode("utf-8"),
    ).hexdigest()[:32]


def _failure_key(email: str) -> str:
    return f"{CACHE_PREFIX}:{_fingerprint(email)}"


def _lock_key(email: str) -> str:
    return f"{LOCK_PREFIX}:{_fingerprint(email)}"


# ------------------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------------------


@_require_security_cache
def is_locked_out(
    *,
    email: str,
) -> bool:
    """
    Return whether the account is currently locked.

    Raise AuthenticationUnavailable when the counter store cannot be read.
    Django's authentication backend converts this to a refused sign-in.
    """

    return bool(_cache().get(_lock_key(email)))


def ensure_not_locked_out(
    *,
    email: str,
) -> None:
    """
    Raise if the account is currently locked.

    Raises:
        AccountLockedOut
    """

    if is_locked_out(email=email):
        raise AccountLockedOut(
            headers={
                "Retry-After": str(settings.LOGIN_LOCKOUT_SECONDS),
            },
        )


@_require_security_cache
def record_login_failure(
    *,
    email: str,
) -> int:
    """
    Register a failed login attempt and lock the account once the
    threshold is reached.

    Returns:
        The current failure count.
    """

    key = _failure_key(email)
    cache = _cache()

    # `add` only succeeds when the key is absent, which starts a fresh
    # window. `incr` afterwards is atomic, so concurrent attempts cannot
    # lose counts the way a get/set pair would.
    if cache.add(key, 1, settings.LOGIN_FAILURE_WINDOW_SECONDS):
        failures = 1
    else:
        try:
            failures = cache.incr(key)
        except ValueError:
            # The window expired between `add` and `incr`.
            cache.set(
                key,
                1,
                settings.LOGIN_FAILURE_WINDOW_SECONDS,
            )
            failures = 1

    if not isinstance(failures, int):
        raise AuthenticationUnavailable(headers={"Retry-After": "30"})

    if failures >= settings.LOGIN_MAX_FAILED_ATTEMPTS:
        cache.set(
            _lock_key(email),
            1,
            settings.LOGIN_LOCKOUT_SECONDS,
        )
        cache.delete(key)

    return failures


@_require_security_cache
def clear_login_failures(
    *,
    email: str,
) -> None:
    """
    Reset the failure counter after a successful authentication.
    """

    _cache().delete_many(
        [
            _failure_key(email),
            _lock_key(email),
        ],
    )
