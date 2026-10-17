"""
Session state cache.

Access tokens are stateless: once issued they stay cryptographically
valid until they expire. Logging out, revoking a device or resetting a
password must take effect immediately, which means every authenticated
request has to answer "is this session still alive?".

Answering that from the database would add a query per request. Instead
the answer is cached:

- Revoking a session writes ``revoked`` immediately, so revocation is
  visible on the very next request.
- A cache miss falls back to the database and caches the result for
  ``ACTIVE_STATE_TTL`` seconds, bounding the load to roughly one query
  per session per minute.

Note that ``CACHES["default"]["OPTIONS"]["IGNORE_EXCEPTIONS"]`` makes
django-redis swallow connection errors and return ``None``. A cache
outage therefore degrades into a database lookup rather than into
sessions being silently treated as valid.
"""

from __future__ import annotations

from uuid import UUID

from django.core.cache import cache

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------

STATE_ACTIVE = "active"
STATE_REVOKED = "revoked"

CACHE_PREFIX = "session_state"

# How long a positive ("still active") answer may be cached. Revocation
# overwrites the entry directly, so this only bounds staleness in the
# rare case where the write to the cache itself failed.
ACTIVE_STATE_TTL = 60

# How long a negative ("revoked") answer is kept. Must outlive the
# refresh token lifetime, otherwise the entry could expire while a
# revoked token is still within its validity window.
REVOKED_STATE_TTL = 60 * 60 * 24 * 30

# How often a session's `last_activity` column is refreshed.
ACTIVITY_UPDATE_INTERVAL = 60 * 5

ACTIVITY_PREFIX = "session_seen"


# ------------------------------------------------------------------------------
# Keys
# ------------------------------------------------------------------------------


def _state_key(session_id: str | UUID) -> str:
    return f"{CACHE_PREFIX}:{session_id}"


def _activity_key(session_id: str | UUID) -> str:
    return f"{ACTIVITY_PREFIX}:{session_id}"


# ------------------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------------------


def is_session_active(
    *,
    session_id: str | UUID,
) -> bool:
    """
    Return whether the session may still authenticate requests.
    """

    cached = cache.get(_state_key(session_id))

    if cached is not None:
        return cached == STATE_ACTIVE

    # Imported lazily: this module is imported from the authentication
    # class, which is loaded before the app registry is ready.
    from apps.users.models import UserSession

    active = UserSession.objects.filter(
        id=session_id,
        is_active=True,
    ).exists()

    cache.set(
        _state_key(session_id),
        STATE_ACTIVE if active else STATE_REVOKED,
        ACTIVE_STATE_TTL if active else REVOKED_STATE_TTL,
    )

    return active


def mark_session_revoked(
    *,
    session_id: str | UUID,
) -> None:
    """
    Record that a session may no longer authenticate requests.

    Called by every revocation path so that access tokens carrying this
    session are rejected on their next use rather than at expiry.
    """

    cache.set(
        _state_key(session_id),
        STATE_REVOKED,
        REVOKED_STATE_TTL,
    )


def mark_sessions_revoked(
    *,
    session_ids,
) -> None:
    """
    Bulk variant of :func:`mark_session_revoked`.
    """

    entries = {_state_key(session_id): STATE_REVOKED for session_id in session_ids}

    if entries:
        cache.set_many(
            entries,
            REVOKED_STATE_TTL,
        )


def should_record_activity(
    *,
    session_id: str | UUID,
) -> bool:
    """
    Return whether `last_activity` is due for a refresh.

    Uses an atomic ``add`` so that concurrent requests for the same
    session produce exactly one database write per interval.
    """

    return cache.add(
        _activity_key(session_id),
        1,
        ACTIVITY_UPDATE_INTERVAL,
    )
