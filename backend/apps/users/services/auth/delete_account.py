"""
Account deletion service.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.users.choices import RevokeReasonChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.account import InvalidPassword
from apps.users.exceptions.authentication import InvalidOTP, MFACodeRequired
from apps.users.models import User
from apps.users.models.tokens import (
    EmailChangeToken,
    EmailVerificationToken,
    PasswordResetToken,
)
from apps.users.services.auth.logout_all import logout_all
from apps.users.services.auth.mfa import is_mfa_enabled, verify_mfa_code
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)


@transaction.atomic
def delete_account(
    *,
    user: User,
    password: str,
    code: str = "",
    request=None,
) -> None:
    """
    Delete the authenticated user's account.

    Workflow:

        - Verify the current password.
        - Verify a second-factor code when MFA is enabled.
        - Revoke every session and refresh token.
        - Invalidate all auth-related one-time tokens.
        - Soft delete the account.

    Personal data is kept for a grace period so a mistaken or malicious
    deletion can be reversed, then removed by `anonymize_account`.

    Raises:
        InvalidPassword, MFACodeRequired, InvalidOTP
    """

    # -------------------------------------------------------------------------
    # Verify password
    # -------------------------------------------------------------------------

    if not user.check_password(password):
        raise InvalidPassword()

    # -------------------------------------------------------------------------
    # Verify the second factor
    #
    # After the password, so a wrong password never reveals whether the
    # account has MFA. A recovery code is accepted and consumed, like
    # everywhere else a code is asked for.
    # -------------------------------------------------------------------------

    if is_mfa_enabled(user=user):
        if not code:
            raise MFACodeRequired()

        if not verify_mfa_code(user=user, code=code):
            raise InvalidOTP()

    # -------------------------------------------------------------------------
    # Revoke sessions and refresh tokens
    #
    # Blacklisted rather than deleted. Deleting OutstandingToken rows
    # cascades into UserSession, which in turn nulls the session link on
    # every SecurityEvent - destroying the audit trail for the account
    # at precisely the moment it becomes most worth keeping.
    # -------------------------------------------------------------------------

    logout_all(
        user=user,
        reason=RevokeReasonChoices.ACCOUNT_DELETED,
    )

    # -------------------------------------------------------------------------
    # Invalidate outstanding one-time tokens
    # -------------------------------------------------------------------------

    now = timezone.now()

    for model in (
        EmailVerificationToken,
        EmailChangeToken,
        PasswordResetToken,
    ):
        model.objects.filter(
            user=user,
            used_at__isnull=True,
        ).update(
            used_at=now,
        )

    # -------------------------------------------------------------------------
    # Soft delete
    # -------------------------------------------------------------------------

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.ACCOUNT_DELETED,
    )

    user.is_active = False
    user.deleted_at = now
    user.set_unusable_password()

    user.save(
        update_fields=[
            "password",
            "is_active",
            "deleted_at",
            "updated_at",
        ],
    )
