"""
Security event choices.
"""

from django.db import models

# =============================================================================
# Event Type
# =============================================================================


class SecurityEventTypeChoices(models.TextChoices):
    """
    Types of security events.
    """

    LOGIN = "login", "Login"

    LOGIN_FAILED = (
        "login_failed",
        "Login Failed",
    )

    LOGOUT = "logout", "Logout"

    LOGOUT_ALL = (
        "logout_all",
        "Logout All",
    )

    TOKEN_REFRESH = (
        "token_refresh",
        "Token Refresh",
    )

    REFRESH_TOKEN_REUSE = (
        "refresh_token_reuse",
        "Refresh Token Reuse",
    )

    SESSION_REVOKED = (
        "session_revoked",
        "Session Revoked",
    )

    DEVICE_TRUSTED = (
        "device_trusted",
        "Device Trusted",
    )

    DEVICE_UNTRUSTED = (
        "device_untrusted",
        "Device Untrusted",
    )

    PASSWORD_CHANGED = (
        "password_changed",
        "Password Changed",
    )

    PASSWORD_RESET_REQUESTED = (
        "password_reset_requested",
        "Password Reset Requested",
    )

    PASSWORD_RESET_COMPLETED = (
        "password_reset_completed",
        "Password Reset Completed",
    )

    EMAIL_VERIFIED = (
        "email_verified",
        "Email Verified",
    )

    EMAIL_CHANGED = (
        "email_changed",
        "Email Changed",
    )

    ACCOUNT_LOCKED = (
        "account_locked",
        "Account Locked",
    )

    ACCOUNT_UNLOCKED = (
        "account_unlocked",
        "Account Unlocked",
    )

    ACCOUNT_DELETED = (
        "account_deleted",
        "Account Deleted",
    )

    ACCOUNT_ANONYMIZED = (
        "account_anonymized",
        "Account Anonymized",
    )

    TWO_FACTOR_ENABLED = (
        "two_factor_enabled",
        "Two Factor Enabled",
    )

    TWO_FACTOR_DISABLED = (
        "two_factor_disabled",
        "Two Factor Disabled",
    )


# =============================================================================
# Event Status
# =============================================================================


class SecurityEventStatusChoices(models.TextChoices):
    """
    Result of the security event.
    """

    SUCCESS = (
        "success",
        "Success",
    )

    FAILED = (
        "failed",
        "Failed",
    )

    WARNING = (
        "warning",
        "Warning",
    )
