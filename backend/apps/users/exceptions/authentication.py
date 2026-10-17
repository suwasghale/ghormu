"""
===============================================================================
Authentication Exceptions
===============================================================================

Exceptions related to authentication and security.

Status codes matter here: authentication failures previously all
returned 400, which prevented clients from distinguishing "your input
was malformed" from "your credentials were rejected" and from driving a
token-refresh-then-retry flow off a 401.
===============================================================================
"""

from core.exceptions import AppException


class AuthenticationException(AppException):
    """Base exception for authentication failures."""

    status_code = 401
    default_code = "authentication_failed"


# =============================================================================
# Credentials
# =============================================================================


class InvalidCredentials(AuthenticationException):
    """
    Raised whenever authentication fails for any reason that must not be
    disclosed: unknown email, wrong password, disabled account or
    soft-deleted account.

    Returning distinct errors for these cases turns the login endpoint
    into an account enumeration oracle.
    """

    default_message = "Invalid email or password."
    default_code = "invalid_credentials"


class InactiveAccount(AuthenticationException):
    default_message = "This account has been disabled."
    default_code = "account_inactive"
    status_code = 403


class EmailNotVerified(AuthenticationException):
    """
    Raised only after the password has been verified, so it discloses
    nothing to a caller who does not already hold valid credentials.
    """

    default_message = "Email address has not been verified."
    default_code = "email_not_verified"
    status_code = 403


class AccountLockedOut(AuthenticationException):
    default_message = "Too many failed login attempts. Please try again later."
    default_code = "account_locked"
    status_code = 429


class AuthenticationUnavailable(AuthenticationException):
    default_message = "Sign-in is temporarily unavailable. Please try again shortly."
    default_code = "authentication_unavailable"
    status_code = 503


# =============================================================================
# OTP
# =============================================================================


class InvalidOTP(AuthenticationException):
    default_message = "Invalid one-time password."
    default_code = "invalid_otp"


class OTPExpired(AuthenticationException):
    default_message = "One-time password has expired."
    default_code = "otp_expired"


# =============================================================================
# Multi-factor authentication
# =============================================================================


class MFARequired(AuthenticationException):
    """
    Raised when the password was correct but a second factor is needed.

    Carries a challenge ticket rather than tokens; the caller exchanges
    it at /auth/mfa/verify/.
    """

    default_message = "A second authentication factor is required."
    default_code = "mfa_required"
    status_code = 401


class MFACodeRequired(AuthenticationException):
    """
    A sensitive action on an account protected by a second factor was
    attempted without a code.

    400 rather than 401: nothing was rejected yet, the request is simply
    incomplete, and the client should ask for the code rather than try to
    refresh its session.
    """

    default_message = (
        "Enter a code from your authenticator app or one of your recovery codes."
    )
    default_code = "mfa_code_required"
    status_code = 400


class MFAAlreadyEnabled(AuthenticationException):
    default_message = "Two-factor authentication is already enabled."
    default_code = "mfa_already_enabled"
    status_code = 400


class MFANotEnabled(AuthenticationException):
    default_message = "Two-factor authentication is not enabled."
    default_code = "mfa_not_enabled"
    status_code = 400


class SocialEmailNotVerified(AuthenticationException):
    """
    The provider did not confirm the address it returned.

    Matching or creating on an unverified address would let anyone able
    to register at that provider claim the corresponding local account.
    """

    default_message = (
        "Your provider did not confirm this email address. "
        "Sign in with a password instead, or verify the address with "
        "your provider first."
    )
    default_code = "social_email_not_verified"
    status_code = 400


class SocialEmailTaken(AuthenticationException):
    default_message = (
        "An account already exists for this email address using a "
        "different profile from this provider."
    )
    default_code = "social_email_taken"
    status_code = 409


class SocialProviderUnknown(AuthenticationException):
    default_message = "That sign-in provider is not configured."
    default_code = "social_provider_unknown"
    status_code = 404


class SocialExchangeFailed(AuthenticationException):
    default_message = "Sign-in with the provider failed. Please try again."
    default_code = "social_exchange_failed"
    status_code = 400


class MFAChallengeInvalid(AuthenticationException):
    default_message = (
        "This verification session is invalid or has expired. Please sign in again."
    )
    default_code = "mfa_challenge_invalid"
    status_code = 401


# =============================================================================
# Email Verification
# =============================================================================


class EmailVerificationTokenInvalid(AuthenticationException):
    default_message = "Email verification link is invalid."
    default_code = "email_verification_token_invalid"
    status_code = 400


class EmailVerificationTokenExpired(AuthenticationException):
    default_message = "Email verification link has expired."
    default_code = "email_verification_token_expired"
    status_code = 400


class EmailAlreadyVerified(AuthenticationException):
    default_message = "Email address has already been verified."
    default_code = "email_already_verified"
    status_code = 400


# =============================================================================
# Password Reset
# =============================================================================


class PasswordResetTokenInvalid(AuthenticationException):
    default_message = "Password reset link is invalid or has expired."
    default_code = "password_reset_token_invalid"
    status_code = 400


class PasswordResetTokenExpired(AuthenticationException):
    default_message = "Password reset link has expired."
    default_code = "password_reset_token_expired"
    status_code = 400


# =============================================================================
# Authentication Token (JWT/API)
# =============================================================================


class AuthenticationTokenInvalid(AuthenticationException):
    default_message = "Authentication token is invalid."
    default_code = "token_invalid"


class AuthenticationTokenExpired(AuthenticationException):
    default_message = "Authentication token has expired."
    default_code = "token_expired"


class RefreshTokenReuseDetected(AuthenticationException):
    """
    Raised when a refresh token that has already been rotated is
    presented again. This indicates the token was captured, so every
    session belonging to the user is revoked.
    """

    default_message = (
        "Refresh token reuse detected. "
        "All sessions have been revoked for your security."
    )
    default_code = "refresh_token_reuse"


# =============================================================================
# Password
# =============================================================================


class CurrentPasswordInvalid(AuthenticationException):
    default_message = "Current password is incorrect."
    default_code = "current_password_invalid"
    status_code = 400


class PasswordMismatch(AuthenticationException):
    default_message = "Passwords do not match."
    default_code = "password_mismatch"
    status_code = 400


class PasswordReuseNotAllowed(AuthenticationException):
    default_message = "The new password must be different from the current password."
    default_code = "password_reuse_not_allowed"
    status_code = 400


# =============================================================================
# Email Change
# =============================================================================


class EmailChangeTokenInvalid(AuthenticationException):
    """
    Raised when an email change token is invalid, expired, or already
    consumed.
    """

    default_message = "Email change token is invalid or has expired."
    default_code = "email_change_token_invalid"
    status_code = 400


class EmailAlreadyInUse(AuthenticationException):
    default_message = "This email address is already in use."
    default_code = "email_already_in_use"
    status_code = 400
