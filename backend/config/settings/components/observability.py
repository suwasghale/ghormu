"""
===============================================================================
Error tracking — Sentry
===============================================================================

Without this, a 500 in production is invisible. `logs/errors.log` only helps
if somebody is reading it on the VPS at the moment it happens, and the people
who notice first are customers who cannot book.

Off unless `SENTRY_DSN` is set, so development and CI stay silent and nothing
has to be stubbed in tests.

===============================================================================
"""

import logging

from config.settings.env import env

# =============================================================================
# Connection
# =============================================================================

SENTRY_DSN = env("SENTRY_DSN", default="")

# Names the deployment in Sentry so a staging error is not mistaken for a
# production one. Defaults from the settings module rather than needing yet
# another variable to keep in sync.
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="production")

# The commit or image tag. Sentry uses it to say which deploy introduced an
# error, which is the difference between "this is broken" and "this broke on
# Tuesday's release".
SENTRY_RELEASE = env("SENTRY_RELEASE", default="")


# =============================================================================
# Scrubbing
# =============================================================================


def _scrub(event: dict, hint: dict) -> dict | None:
    """
    Drop anything that should never leave the server.

    Sentry's own `send_default_pii=False` already withholds request bodies,
    cookies and user identity. This is the second layer, because the cost of
    being wrong is a third party holding the agency's customer data -- and
    because a stack frame's local variables are where a password or a token
    ends up regardless of what the transport layer decides to send.
    """

    request = event.get("request") or {}

    # Query strings carry reset tokens and unsubscribe signatures. The path
    # alone is what makes an error findable; the parameters are not needed.
    if "query_string" in request:
        request["query_string"] = ""

    for header in ("Authorization", "Cookie", "X-CSRFToken", "Proxy-Authorization"):
        if header in (request.get("headers") or {}):
            request["headers"][header] = "[scrubbed]"

    for exception in (event.get("exception") or {}).get("values", []):
        for frame in (exception.get("stacktrace") or {}).get("frames", []):
            variables = frame.get("vars") or {}
            for name in list(variables):
                lowered = name.lower()
                if any(
                    marker in lowered
                    for marker in (
                        "password",
                        "token",
                        "secret",
                        "key",
                        "authorization",
                        "credential",
                        "signature",
                        "otp",
                    )
                ):
                    variables[name] = "[scrubbed]"

    return event


# =============================================================================
# Initialisation
# =============================================================================

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        release=SENTRY_RELEASE or None,
        integrations=[
            DjangoIntegration(),
            # Without this a task that dies in a worker is silent: the
            # request that queued it already returned 202, so nothing on the
            # web side ever knows. Queued e-mail is exactly this shape.
            CeleryIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,  # breadcrumbs
                event_level=logging.ERROR,  # what becomes an issue
            ),
        ],
        # Off. This site takes bookings from named people with e-mail
        # addresses and phone numbers; sending request bodies and user
        # identity to a third party is a GDPR decision, not a debugging
        # convenience, and it is not one to make by default.
        send_default_pii=False,
        # Sampled, because a busy season would otherwise cost a fortune and
        # bury the signal. 10% is enough to see which endpoints are slow.
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1),
        before_send=_scrub,
        # `attach_stacktrace` on messages, not just exceptions: a
        # `logger.error(...)` with no exception is otherwise a line of text
        # with no indication of where it came from.
        attach_stacktrace=True,
        max_breadcrumbs=30,
    )
