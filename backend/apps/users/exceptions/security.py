"""
Security-related domain exceptions.
"""

from __future__ import annotations

from rest_framework.exceptions import ValidationError


class CurrentSessionRevokeDenied(ValidationError):
    """
    Raised when attempting to revoke the current session.
    """

    default_detail = {
        "session": (
            "You cannot revoke your current session. Use the logout endpoint instead."
        )
    }

    default_code = "current_session_revoke_denied"
