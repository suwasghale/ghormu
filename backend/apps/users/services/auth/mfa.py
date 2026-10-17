"""
Multi-factor authentication services.

Enrolment is two-step and verification is replay-protected. Both matter:

- A secret created but never confirmed must not gate login, or a user
  who abandons enrolment locks themselves out.
- A TOTP code stays valid for its whole time window, so accepting the
  same counter twice lets anyone who observes a code reuse it within
  that window.
"""

from __future__ import annotations

import hashlib
import secrets
import time
from dataclasses import dataclass

import pyotp
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import (
    InvalidOTP,
    MFAAlreadyEnabled,
    MFANotEnabled,
)
from apps.users.models import RecoveryCode, TOTPDevice, User
from apps.users.services.security.log_security_activity import (
    log_security_activity,
)

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------

RECOVERY_CODE_COUNT = 10

# 5 random bytes (40 bits) -> 10 hex characters, formatted XXXX-XXXXXX.
RECOVERY_CODE_BYTES = 5

TOTP_INTERVAL = 30


# ------------------------------------------------------------------------------
# DTOs
# ------------------------------------------------------------------------------


@dataclass(slots=True)
class Enrolment:
    """
    Everything the client needs to finish setting up an authenticator.
    """

    secret: str
    provisioning_uri: str


@dataclass(slots=True)
class RecoveryCodes:
    """
    Freshly generated recovery codes.

    Returned exactly once, at generation. Only hashes are stored, so
    they cannot be shown again.
    """

    codes: list[str]


# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------


def _hash_code(code: str) -> str:
    return hashlib.sha256(
        code.replace("-", "").replace(" ", "").upper().encode("utf-8"),
    ).hexdigest()


def _generate_recovery_codes() -> list[str]:
    codes = []

    for _ in range(RECOVERY_CODE_COUNT):
        raw = secrets.token_hex(RECOVERY_CODE_BYTES).upper()
        codes.append(f"{raw[:4]}-{raw[4:]}")

    return codes


def _issuer() -> str:
    return getattr(settings, "APP_NAME", "Backend")


# ------------------------------------------------------------------------------
# Enrolment
# ------------------------------------------------------------------------------


@transaction.atomic
def start_totp_enrolment(
    *,
    user: User,
) -> Enrolment:
    """
    Create (or replace) an unconfirmed TOTP secret.

    Re-enrolling while already confirmed is refused: it would let anyone
    holding a live session silently swap the second factor, which
    defeats the point of having one.

    Raises:
        MFAAlreadyEnabled
    """

    device = TOTPDevice.objects.filter(user=user).first()

    if device is not None and device.is_confirmed:
        raise MFAAlreadyEnabled()

    secret = pyotp.random_base32()

    if device is None:
        device = TOTPDevice.objects.create(user=user, secret=secret)
    else:
        # An abandoned enrolment is replaced rather than reused, so a
        # secret that may have been exposed is not carried forward.
        device.secret = secret
        device.last_used_counter = None
        device.save(update_fields=["secret", "last_used_counter", "updated_at"])

    uri = pyotp.TOTP(secret, interval=TOTP_INTERVAL).provisioning_uri(
        name=user.email,
        issuer_name=_issuer(),
    )

    return Enrolment(secret=secret, provisioning_uri=uri)


@transaction.atomic
def confirm_totp_enrolment(
    *,
    user: User,
    code: str,
    request=None,
) -> RecoveryCodes:
    """
    Activate a pending TOTP device and issue recovery codes.

    Raises:
        MFANotEnabled, MFAAlreadyEnabled, InvalidOTP
    """

    device = TOTPDevice.objects.filter(user=user).first()

    if device is None:
        raise MFANotEnabled()

    if device.is_confirmed:
        raise MFAAlreadyEnabled()

    if not _check_code(device=device, code=code, persist=False):
        raise InvalidOTP()

    device.confirm()

    codes = _replace_recovery_codes(user=user)

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.TWO_FACTOR_ENABLED,
    )

    return codes


@transaction.atomic
def disable_mfa(
    *,
    user: User,
    request=None,
) -> None:
    """
    Remove the second factor entirely.

    Callers must re-verify the password first; this service does not,
    because it is also used by account deletion.

    Raises:
        MFANotEnabled
    """

    device = TOTPDevice.objects.filter(user=user).first()

    if device is None or not device.is_confirmed:
        raise MFANotEnabled()

    device.delete()

    RecoveryCode.objects.filter(user=user).delete()

    log_security_activity(
        user=user,
        request=request,
        event_type=SecurityEventTypeChoices.TWO_FACTOR_DISABLED,
    )


# ------------------------------------------------------------------------------
# Verification
# ------------------------------------------------------------------------------


def is_mfa_enabled(*, user: User) -> bool:
    """
    Return whether a confirmed second factor guards this account.
    """

    return TOTPDevice.objects.filter(
        user=user,
        confirmed_at__isnull=False,
    ).exists()


@transaction.atomic
def verify_mfa_code(
    *,
    user: User,
    code: str,
) -> bool:
    """
    Verify a TOTP code or a recovery code.

    Accepts either, so a user without their phone is not locked out.

    Returns:
        True when the code was accepted.
    """

    code = code.strip()

    device = (
        TOTPDevice.objects.select_for_update()
        .filter(user=user, confirmed_at__isnull=False)
        .first()
    )

    if device is None:
        return False

    if _check_code(device=device, code=code, persist=True):
        return True

    return _consume_recovery_code(user=user, code=code)


def _check_code(
    *,
    device: TOTPDevice,
    code: str,
    persist: bool,
) -> bool:
    """
    Validate a TOTP code against the device secret.

    `valid_window=1` accepts the neighbouring windows so a slightly
    wrong clock still works. The accepted counter is recorded so the
    same code cannot be presented twice.
    """

    code = code.replace(" ", "")

    if not code.isdigit():
        return False

    totp = pyotp.TOTP(device.secret, interval=TOTP_INTERVAL)

    if not totp.verify(code, valid_window=1):
        return False

    counter = int(time.time()) // TOTP_INTERVAL

    if device.last_used_counter is not None and counter <= device.last_used_counter:
        # Already used within this window: replay.
        return False

    if persist:
        device.last_used_counter = counter
        device.save(
            update_fields=["last_used_counter", "updated_at"],
        )

    return True


def _consume_recovery_code(
    *,
    user: User,
    code: str,
) -> bool:
    """
    Spend a single-use recovery code.
    """

    updated = RecoveryCode.objects.filter(
        user=user,
        code_hash=_hash_code(code),
        used_at__isnull=True,
    ).update(used_at=timezone.now())

    return bool(updated)


# ------------------------------------------------------------------------------
# Recovery codes
# ------------------------------------------------------------------------------


@transaction.atomic
def regenerate_recovery_codes(
    *,
    user: User,
) -> RecoveryCodes:
    """
    Replace every recovery code with a fresh set.

    Raises:
        MFANotEnabled
    """

    if not is_mfa_enabled(user=user):
        raise MFANotEnabled()

    return _replace_recovery_codes(user=user)


def _replace_recovery_codes(*, user: User) -> RecoveryCodes:
    RecoveryCode.objects.filter(user=user).delete()

    codes = _generate_recovery_codes()

    RecoveryCode.objects.bulk_create(
        [RecoveryCode(user=user, code_hash=_hash_code(code)) for code in codes],
    )

    return RecoveryCodes(codes=codes)


def count_unused_recovery_codes(*, user: User) -> int:
    """
    How many recovery codes remain.
    """

    return RecoveryCode.objects.filter(
        user=user,
        used_at__isnull=True,
    ).count()
