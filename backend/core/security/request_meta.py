"""
Helpers for extracting client metadata from a request.

Client IP resolution is security sensitive: ``X-Forwarded-For`` is
attacker controlled unless the application sits behind a reverse proxy
that overwrites it. Trusting it blindly poisons audit logs and defeats
IP based rate limiting.

``TRUSTED_PROXY_COUNT`` declares how many proxies sit in front of the
application. Only that many right-most entries of the forwarded chain
are considered trustworthy; everything to their left was supplied by
the client and is discarded.
"""

from __future__ import annotations

from django.conf import settings

# ------------------------------------------------------------------------------
# Client IP
# ------------------------------------------------------------------------------


def get_client_ip(request) -> str | None:
    """
    Return the client's IP address.

    With ``TRUSTED_PROXY_COUNT = 0`` (the default) the forwarded header is
    ignored entirely and ``REMOTE_ADDR`` is used, which cannot be spoofed.

    With ``TRUSTED_PROXY_COUNT = n`` the n-th entry from the right of
    ``X-Forwarded-For`` is returned, which is the address the outermost
    trusted proxy observed.
    """

    trusted_proxies = getattr(
        settings,
        "TRUSTED_PROXY_COUNT",
        0,
    )

    remote_addr = request.META.get("REMOTE_ADDR")

    if trusted_proxies <= 0:
        return remote_addr

    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")

    if not forwarded:
        return remote_addr

    chain = [part.strip() for part in forwarded.split(",") if part.strip()]

    if not chain:
        return remote_addr

    # The right-most entry is appended by the closest proxy. Walking
    # `trusted_proxies` hops to the left lands on the address that the
    # outermost proxy we control actually saw.
    index = len(chain) - trusted_proxies

    if index < 0:
        # Chain is shorter than expected: the request did not traverse
        # the full proxy path, so nothing in it can be trusted.
        return remote_addr

    return chain[index]


# ------------------------------------------------------------------------------
# User agent
# ------------------------------------------------------------------------------

# Bounded to keep a hostile client from writing unbounded rows into the
# session and audit tables.
USER_AGENT_MAX_LENGTH = 512


def get_user_agent(request) -> str:
    """
    Return the request's User-Agent header, truncated to a safe length.
    """

    return request.META.get(
        "HTTP_USER_AGENT",
        "",
    )[:USER_AGENT_MAX_LENGTH]
