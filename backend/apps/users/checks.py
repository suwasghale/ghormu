"""
System checks for the users app.
"""

from __future__ import annotations

from django.conf import settings
from django.core.checks import Error, Tags, register


@register(Tags.security)
def check_google_oauth_configuration(app_configs=None, **kwargs):
    """
    Half a Google configuration is a mistake, not a choice.

    With only one credential set, the provider is silently left
    unregistered and the sign-in button never appears, which is easy to
    mistake for a frontend bug.
    """

    client_id = bool(settings.GOOGLE_OAUTH_CLIENT_ID)
    client_secret = bool(settings.GOOGLE_OAUTH_CLIENT_SECRET)

    if client_id == client_secret:
        return []

    return [
        Error(
            "Google sign-in is only half configured.",
            hint=(
                "Set both GOOGLE_OAUTH_CLIENT_ID and "
                "GOOGLE_OAUTH_CLIENT_SECRET, or neither."
            ),
            id="users.E001",
        ),
    ]
