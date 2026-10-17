"""
Social sign-in.

See base.py for the provider contract and what the shared half
enforces. Providers are registered at import time by apps.users.apps.
"""

from .base import (
    AuthorizationRequest,
    SocialProfile,
    SocialProvider,
    available_providers,
    consume_state,
    get_provider,
    issue_state,
    register_provider,
)

__all__ = [
    "AuthorizationRequest",
    "SocialProfile",
    "SocialProvider",
    "available_providers",
    "consume_state",
    "get_provider",
    "issue_state",
    "register_provider",
]
