"""
Two-factor authentication.

The properties that matter: an unconfirmed device must not gate login,
a code must not work twice, and the challenge ticket must not be a
second way in.
"""

from __future__ import annotations

import time

import pyotp
import pytest
from django.test import override_settings
from django.urls import reverse

from apps.users.models import RecoveryCode, TOTPDevice
from apps.users.services.auth.mfa import TOTP_INTERVAL
from tests.factories import DEFAULT_PASSWORD

pytestmark = pytest.mark.django_db


def _code(secret: str, at: int | None = None) -> str:
    totp = pyotp.TOTP(secret, interval=TOTP_INTERVAL)
    return totp.at(at) if at else totp.now()


@pytest.fixture
def enrol(authed_client):
    """
    Start enrolment and return the secret.
    """

    response = authed_client.post(
        reverse("v1:auth:mfa-enrol"),
        {},
        format="json",
    )

    assert response.status_code == 200, response.data

    return response.data["data"]["secret"]


@pytest.fixture
def mfa_user(authed_client, enrol, user):
    """
    A user with a confirmed second factor. Returns (user, secret).
    """

    response = authed_client.post(
        reverse("v1:auth:mfa-confirm"),
        {"code": _code(enrol)},
        format="json",
    )

    assert response.status_code == 200, response.data

    return user, enrol, response.data["data"]["codes"]


# ------------------------------------------------------------------------------
# Enrolment
# ------------------------------------------------------------------------------


def test_enrolment_returns_a_provisioning_uri(authed_client):
    response = authed_client.post(
        reverse("v1:auth:mfa-enrol"),
        {},
        format="json",
    )

    assert response.status_code == 200

    uri = response.data["data"]["provisioning_uri"]

    assert uri.startswith("otpauth://totp/")
    assert "secret=" in uri


def test_unconfirmed_device_does_not_gate_login(
    api_client,
    user,
    enrol,
):
    """
    An abandoned enrolment must not lock the user out of their account.
    """

    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["tokens"]["access"]


def test_confirming_requires_a_valid_code(authed_client, enrol):
    response = authed_client.post(
        reverse("v1:auth:mfa-confirm"),
        {"code": "000000"},
        format="json",
    )

    assert response.status_code in (400, 401)
    assert not TOTPDevice.objects.filter(
        confirmed_at__isnull=False,
    ).exists()


def test_a_rejected_code_is_identified_by_its_error_code(authed_client, enrol):
    """
    A wrong code and an expired access token are both 401s. The client
    refreshes and retries only on the second, so the envelope must say
    which one it is.
    """

    response = authed_client.post(
        reverse("v1:auth:mfa-confirm"),
        {"code": "000000"},
        format="json",
    )

    assert response.data["code"] == "invalid_otp"


def test_confirming_issues_recovery_codes(mfa_user):
    _, _, codes = mfa_user

    assert len(codes) == 10
    assert RecoveryCode.objects.count() == 10

    # Only hashes are stored.
    stored = set(
        RecoveryCode.objects.values_list("code_hash", flat=True),
    )
    assert not (set(codes) & stored)


def test_cannot_enrol_twice(authed_client, mfa_user):
    response = authed_client.post(
        reverse("v1:auth:mfa-enrol"),
        {},
        format="json",
    )

    assert response.status_code == 400


# ------------------------------------------------------------------------------
# Login
# ------------------------------------------------------------------------------


def test_login_withholds_tokens_and_returns_a_ticket(
    api_client,
    mfa_user,
):
    user, _, _ = mfa_user

    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 401
    assert response.data["errors"]["mfa_ticket"]

    # Crucially, no tokens anywhere in the response.
    assert "access" not in str(response.data)


def test_ticket_plus_code_completes_login(api_client, mfa_user):
    user, secret, _ = mfa_user

    ticket = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    ).data["errors"]["mfa_ticket"]

    response = api_client.post(
        reverse("v1:auth:mfa-verify"),
        {"mfa_ticket": ticket, "code": _code(secret)},
        format="json",
    )

    assert response.status_code == 200, response.data
    assert response.data["data"]["tokens"]["access"]


def test_ticket_is_single_use(api_client, mfa_user):
    user, secret, _ = mfa_user

    ticket = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    ).data["errors"]["mfa_ticket"]

    payload = {"mfa_ticket": ticket, "code": _code(secret)}

    assert (
        api_client.post(
            reverse("v1:auth:mfa-verify"),
            payload,
            format="json",
        ).status_code
        == 200
    )

    # Same ticket again: the code is also replayed, so both guards fire.
    assert (
        api_client.post(
            reverse("v1:auth:mfa-verify"),
            payload,
            format="json",
        ).status_code
        == 401
    )


def test_a_forged_ticket_is_rejected(api_client, mfa_user):
    response = api_client.post(
        reverse("v1:auth:mfa-verify"),
        {"mfa_ticket": "not-a-real-ticket", "code": "123456"},
        format="json",
    )

    assert response.status_code == 401


def test_ticket_from_one_account_cannot_sign_in_another(
    api_client,
    mfa_user,
    other_user,
):
    """
    The ticket identifies the user; it must not be usable with another
    account's code.
    """

    user, _, _ = mfa_user

    ticket = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    ).data["errors"]["mfa_ticket"]

    other_secret = pyotp.random_base32()

    response = api_client.post(
        reverse("v1:auth:mfa-verify"),
        {"mfa_ticket": ticket, "code": _code(other_secret)},
        format="json",
    )

    assert response.status_code in (400, 401)


def test_wrong_password_never_reaches_the_challenge(
    api_client,
    mfa_user,
):
    """
    The second factor is a second step, not a substitute for the first.
    """

    user, _, _ = mfa_user

    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": "wrong-password-1"},
        format="json",
    )

    assert response.status_code == 401
    assert response.data["errors"] is None


# ------------------------------------------------------------------------------
# Replay
# ------------------------------------------------------------------------------


def test_a_code_cannot_be_used_twice(api_client, mfa_user):
    """
    A TOTP code stays valid for its whole window. Without a replay
    guard, anyone who observes one can reuse it inside that window.
    """

    user, secret, _ = mfa_user
    code = _code(secret)

    def attempt():
        ticket = api_client.post(
            reverse("v1:auth:login"),
            {"email": user.email, "password": DEFAULT_PASSWORD},
            format="json",
        ).data["errors"]["mfa_ticket"]

        return api_client.post(
            reverse("v1:auth:mfa-verify"),
            {"mfa_ticket": ticket, "code": code},
            format="json",
        )

    assert attempt().status_code == 200
    assert attempt().status_code in (400, 401)


def test_an_old_code_is_rejected(mfa_user):
    from apps.users.services.auth.mfa import verify_mfa_code

    user, secret, _ = mfa_user

    stale = _code(secret, at=int(time.time()) - (TOTP_INTERVAL * 10))

    assert verify_mfa_code(user=user, code=stale) is False


# ------------------------------------------------------------------------------
# Recovery codes
# ------------------------------------------------------------------------------


def test_recovery_code_completes_login(api_client, mfa_user):
    user, _, codes = mfa_user

    ticket = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    ).data["errors"]["mfa_ticket"]

    response = api_client.post(
        reverse("v1:auth:mfa-verify"),
        {"mfa_ticket": ticket, "code": codes[0]},
        format="json",
    )

    assert response.status_code == 200, response.data


def test_recovery_code_is_single_use(api_client, mfa_user):
    user, _, codes = mfa_user

    def attempt():
        ticket = api_client.post(
            reverse("v1:auth:login"),
            {"email": user.email, "password": DEFAULT_PASSWORD},
            format="json",
        ).data["errors"]["mfa_ticket"]

        return api_client.post(
            reverse("v1:auth:mfa-verify"),
            {"mfa_ticket": ticket, "code": codes[0]},
            format="json",
        )

    assert attempt().status_code == 200
    assert attempt().status_code in (400, 401)


def test_regenerating_invalidates_the_previous_codes(
    authed_client,
    mfa_user,
):
    _, secret, old_codes = mfa_user

    response = authed_client.post(
        reverse("v1:auth:mfa-recovery-codes"),
        {"code": _code(secret)},
        format="json",
    )

    assert response.status_code == 200

    new_codes = response.data["data"]["codes"]

    assert set(new_codes).isdisjoint(old_codes)
    assert RecoveryCode.objects.count() == 10


# ------------------------------------------------------------------------------
# Disabling
# ------------------------------------------------------------------------------


def test_disable_requires_password_and_code(authed_client, mfa_user):
    _, secret, _ = mfa_user

    # Code alone is not enough.
    assert (
        authed_client.post(
            reverse("v1:auth:mfa-disable"),
            {"code": _code(secret), "password": "wrong-password-1"},
            format="json",
        ).status_code
        == 400
    )

    assert TOTPDevice.objects.filter(
        confirmed_at__isnull=False,
    ).exists()


def test_disable_removes_the_factor_and_codes(
    authed_client,
    mfa_user,
):
    _, secret, _ = mfa_user

    response = authed_client.post(
        reverse("v1:auth:mfa-disable"),
        {"code": _code(secret), "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 200, response.data
    assert not TOTPDevice.objects.exists()
    assert not RecoveryCode.objects.exists()


def test_login_works_normally_after_disabling(
    api_client,
    authed_client,
    mfa_user,
):
    user, secret, _ = mfa_user

    authed_client.post(
        reverse("v1:auth:mfa-disable"),
        {"code": _code(secret), "password": DEFAULT_PASSWORD},
        format="json",
    )

    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["tokens"]["access"]


# ------------------------------------------------------------------------------
# Status
# ------------------------------------------------------------------------------


def test_status_reports_enabled_and_remaining_codes(
    authed_client,
    mfa_user,
):
    response = authed_client.get(reverse("v1:auth:mfa-status"))

    assert response.status_code == 200
    assert response.data["data"]["enabled"] is True
    assert response.data["data"]["recovery_codes_remaining"] == 10


def test_status_is_false_without_enrolment(authed_client):
    response = authed_client.get(reverse("v1:auth:mfa-status"))

    assert response.data["data"]["enabled"] is False


# ------------------------------------------------------------------------------
# Brute force
# ------------------------------------------------------------------------------


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_code_guessing_counts_against_the_account_lockout(
    api_client,
    mfa_user,
):
    """
    A six-digit code is a small search space; guessing must be bounded
    by the same budget that bounds password guessing.
    """

    user, _, _ = mfa_user

    for _ in range(3):
        ticket = api_client.post(
            reverse("v1:auth:login"),
            {"email": user.email, "password": DEFAULT_PASSWORD},
            format="json",
        ).data["errors"]["mfa_ticket"]

        api_client.post(
            reverse("v1:auth:mfa-verify"),
            {"mfa_ticket": ticket, "code": "000000"},
            format="json",
        )

    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 429
