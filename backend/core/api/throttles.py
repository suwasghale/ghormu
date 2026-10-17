"""
Reusable DRF throttles.

Each throttle represents a business capability rather than a specific
endpoint. Rates are configured in
``REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]``.

Anonymous throttles key on the client IP, resolved through the trusted
proxy configuration so that a forged ``X-Forwarded-For`` cannot be used
to reset the bucket.
"""

from __future__ import annotations

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from core.security.request_meta import get_client_ip


class TrustedIPAnonThrottle(AnonRateThrottle):
    """
    Anonymous throttle that resolves the client IP safely.

    DRF's default reads the left-most ``X-Forwarded-For`` entry when
    ``NUM_PROXIES`` is unset, which is fully attacker controlled: a
    client can defeat the throttle entirely by varying that header.
    """

    def get_ident(self, request) -> str:
        return get_client_ip(request) or "unknown"


# =============================================================================
# Public
# =============================================================================


class PublicThrottle(TrustedIPAnonThrottle):
    """
    Generic throttle for public endpoints.
    """

    scope = "public"


# =============================================================================
# Authentication
# =============================================================================


class LoginThrottle(TrustedIPAnonThrottle):
    """
    Limit login attempts per source address.

    Complements the per-account lockout in
    ``apps.users.services.auth.lockout``: this bounds one host, the
    lockout bounds one account against many hosts.
    """

    scope = "login"


class TokenRefreshThrottle(TrustedIPAnonThrottle):
    """
    Limit token refresh attempts.
    """

    scope = "token_refresh"


class PasswordResetThrottle(TrustedIPAnonThrottle):
    """
    Limit password reset requests.

    Prevents password reset email abuse.
    """

    scope = "password_reset"


class PasswordResetConfirmThrottle(TrustedIPAnonThrottle):
    """
    Limit password reset completion attempts.

    Without this the reset endpoint accepts unlimited token guesses.
    """

    scope = "password_reset_confirm"


class EmailVerificationThrottle(TrustedIPAnonThrottle):
    """
    Limit email verification attempts.
    """

    scope = "email_verification"


class EmailVerificationResendThrottle(TrustedIPAnonThrottle):
    """
    Limit verification email resends.

    Each request queues an outbound email, so an unthrottled endpoint is
    a mail bomb aimed at any address the caller chooses.
    """

    scope = "email_verification_resend"


class RegistrationThrottle(TrustedIPAnonThrottle):
    """
    Limit account creation.
    """

    scope = "registration"


# =============================================================================
# Authenticated
# =============================================================================


class AuthenticatedThrottle(UserRateThrottle):
    """
    Generic authenticated user throttle.
    """

    scope = "authenticated"


class PasswordChangeThrottle(UserRateThrottle):
    """
    Limit password change attempts.
    """

    scope = "password_change"


class EmailChangeThrottle(UserRateThrottle):
    """
    Limit email change attempts.
    """

    scope = "email_change"


class AccountDeleteThrottle(UserRateThrottle):
    """
    Limit account deletion attempts.
    """

    scope = "account_delete"


# =============================================================================
# Multi-factor authentication
# =============================================================================


class MFAThrottle(UserRateThrottle):
    """
    Limit enrolment, disable and recovery-code operations.
    """

    scope = "mfa"


class MFAVerifyThrottle(TrustedIPAnonThrottle):
    """
    Limit second-factor verification attempts.

    A six-digit code is only 10^6 wide, so this is the difference
    between a factor that resists guessing and one that does not. The
    per-challenge attempt counter bounds one ticket; this bounds the
    caller across tickets.
    """

    scope = "mfa_verify"
