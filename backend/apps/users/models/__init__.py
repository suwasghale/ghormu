"""
Identity and authentication models.

Profile and Address deliberately live in apps.profiles: they are
application domain rather than authentication, and keeping them out
means this app can be reused without dragging them along.
"""

from .mfa import RecoveryCode, TOTPDevice
from .security_event import SecurityEvent
from .session import UserSession
from .social import SocialAccount
from .user import User

__all__ = [
    "RecoveryCode",
    "SecurityEvent",
    "SocialAccount",
    "TOTPDevice",
    "User",
    "UserSession",
]
