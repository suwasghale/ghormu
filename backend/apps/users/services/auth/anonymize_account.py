"""
Anonymization of deleted accounts.

Deleting an account is a soft delete: the row is deactivated but keeps
its personal data, so a mistaken or malicious deletion can be reversed.
That cannot last forever. Once the grace period
(``ACCOUNT_DELETION_GRACE_DAYS``) has passed, this module removes
everything that identifies the person while keeping the row and its
security history:

- Email and name are replaced. The original address becomes free to
  register again.
- MFA secrets, recovery codes, social links and one-time tokens are
  deleted.
- Network identifiers (IP address, user agent, city) are stripped from
  sessions and security events. The events themselves stay, because an
  audit trail with gaps where deleted accounts were is not an audit
  trail.
- Other apps erase their own data through the ``account_anonymized``
  signal.

The row is not hard deleted. Doing so would cascade into the session and
security-event tables and destroy exactly the history that explains
what happened to the account.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.users.choices.security_event import SecurityEventTypeChoices
from apps.users.models import (
    RecoveryCode,
    SecurityEvent,
    SocialAccount,
    TOTPDevice,
    User,
    UserSession,
)
from apps.users.models.tokens import (
    EmailChangeToken,
    EmailVerificationToken,
    PasswordResetToken,
)
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)
from apps.users.signals import account_anonymized

logger = logging.getLogger(__name__)

# RFC 2606 reserves `.invalid`, so this can never be a deliverable
# address or collide with a real one.
ANONYMIZED_EMAIL_DOMAIN = "deleted.invalid"


def anonymized_email(user: User) -> str:
    """
    A unique placeholder address for an anonymized account.
    """

    return f"deleted-{user.pk.hex}@{ANONYMIZED_EMAIL_DOMAIN}"


def anonymization_due_before(now=None):
    """
    Accounts deleted before this moment are past their grace period.
    """

    now = now or timezone.now()

    return now - timedelta(days=settings.ACCOUNT_DELETION_GRACE_DAYS)


@transaction.atomic
def anonymize_account(*, user: User) -> None:
    """
    Remove the personal data of a deleted account.

    Idempotent: an account that is already anonymized is left alone.

    Raises:
        ValueError: when the account has not been deleted.
    """

    user = User.objects.select_for_update().get(pk=user.pk)

    if user.deleted_at is None:
        raise ValueError("Only deleted accounts can be anonymized.")

    if user.anonymized_at is not None:
        return

    now = timezone.now()

    # -------------------------------------------------------------------------
    # Credentials and links that identify the person
    # -------------------------------------------------------------------------

    TOTPDevice.objects.filter(user=user).delete()
    RecoveryCode.objects.filter(user=user).delete()
    SocialAccount.objects.filter(user=user).delete()

    for model in (
        EmailVerificationToken,
        EmailChangeToken,
        PasswordResetToken,
    ):
        model.objects.filter(user=user).delete()

    # -------------------------------------------------------------------------
    # Network identifiers. The rows stay for the audit trail.
    # -------------------------------------------------------------------------

    UserSession.objects.filter(user=user).update(
        ip_address=None,
        user_agent="",
        city="",
        country=None,
    )

    SecurityEvent.objects.filter(user=user).update(
        ip_address=None,
        user_agent="",
        city="",
        country=None,
    )

    # -------------------------------------------------------------------------
    # Identity
    # -------------------------------------------------------------------------

    user.email = anonymized_email(user)
    user.first_name = ""
    user.last_name = ""
    user.last_seen = None
    user.is_active = False
    user.is_staff = False
    user.is_superuser = False
    user.anonymized_at = now
    user.set_unusable_password()

    user.save(
        update_fields=[
            "email",
            "first_name",
            "last_name",
            "last_seen",
            "is_active",
            "is_staff",
            "is_superuser",
            "anonymized_at",
            "password",
            "updated_at",
        ],
    )

    user.groups.clear()
    user.user_permissions.clear()

    # -------------------------------------------------------------------------
    # Data owned by other apps
    # -------------------------------------------------------------------------

    account_anonymized.send(sender=User, user=user)

    log_security_activity(
        user=user,
        event_type=SecurityEventTypeChoices.ACCOUNT_ANONYMIZED,
    )


def anonymize_expired_deleted_accounts(*, now=None) -> int:
    """
    Anonymize every deleted account whose grace period has ended.

    Each account is handled in its own transaction, so one failure does
    not block the rest; it is logged and retried on the next run.

    Returns:
        Number of accounts anonymized.
    """

    due = User.objects.filter(
        deleted_at__isnull=False,
        deleted_at__lt=anonymization_due_before(now),
        anonymized_at__isnull=True,
    ).only("pk")

    anonymized = 0

    for user in due.iterator():
        try:
            anonymize_account(user=user)
        except Exception:
            logger.exception(
                "Could not anonymize deleted account %s.",
                user.pk,
            )
        else:
            anonymized += 1

    return anonymized
