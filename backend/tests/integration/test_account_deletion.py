"""
Account deletion and anonymization.

What matters: deleting an MFA-protected account takes the second factor
as well as the password, a deleted account keeps its data only for the
grace period, and anonymization removes what identifies the person
without destroying the security history.
"""

from __future__ import annotations

from datetime import timedelta

import pyotp
import pytest
from django.core.checks import run_checks
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone

from apps.profiles.models import Address, Profile
from apps.users.choices.security_event import SecurityEventTypeChoices
from apps.users.models import (
    RecoveryCode,
    SecurityEvent,
    SocialAccount,
    TOTPDevice,
    User,
    UserSession,
)
from apps.users.services.auth.anonymize_account import (
    ANONYMIZED_EMAIL_DOMAIN,
    anonymize_account,
    anonymize_expired_deleted_accounts,
)
from apps.users.services.auth.mfa import TOTP_INTERVAL
from apps.users.services.auth.social import available_providers
from apps.users.services.auth.social.base import _REGISTRY
from apps.users.services.auth.social.google import register_if_configured
from tests.factories import DEFAULT_PASSWORD, DeletedUserFactory, UserFactory

pytestmark = pytest.mark.django_db

DELETE_URL = "v1:auth:account-delete"


def _code(secret: str) -> str:
    return pyotp.TOTP(secret, interval=TOTP_INTERVAL).now()


@pytest.fixture
def mfa_secret(authed_client):
    """
    Enable MFA on the authenticated user and return the TOTP secret.
    """

    secret = authed_client.post(reverse("v1:auth:mfa-enrol"), {}, format="json").data[
        "data"
    ]["secret"]

    response = authed_client.post(
        reverse("v1:auth:mfa-confirm"),
        {"code": _code(secret)},
        format="json",
    )

    assert response.status_code == 200, response.data

    return secret


def _delete(client, **payload):
    return client.delete(reverse(DELETE_URL), payload, format="json")


# ------------------------------------------------------------------------------
# Deletion
# ------------------------------------------------------------------------------


def test_deleting_without_mfa_needs_only_the_password(
    authed_client,
    user,
    django_capture_on_commit_callbacks,
):
    with django_capture_on_commit_callbacks(execute=True):
        response = _delete(authed_client, password=DEFAULT_PASSWORD)

    assert response.status_code == 200, response.data

    user.refresh_from_db()
    assert user.deleted_at is not None
    assert not user.is_active
    assert SecurityEvent.objects.filter(
        user=user,
        event_type=SecurityEventTypeChoices.ACCOUNT_DELETED,
    ).exists()


def test_a_wrong_password_is_rejected_before_mfa_is_mentioned(
    authed_client,
    user,
    mfa_secret,
):
    response = _delete(authed_client, password="not-the-password")

    assert response.status_code == 400
    assert response.data["code"] == "invalid_password"

    user.refresh_from_db()
    assert user.deleted_at is None


def test_mfa_account_requires_a_code(authed_client, user, mfa_secret):
    response = _delete(authed_client, password=DEFAULT_PASSWORD)

    assert response.status_code == 400
    assert response.data["code"] == "mfa_code_required"

    user.refresh_from_db()
    assert user.deleted_at is None


def test_mfa_account_rejects_a_wrong_code(authed_client, user, mfa_secret):
    response = _delete(authed_client, password=DEFAULT_PASSWORD, code="000000")

    assert response.status_code == 401
    assert response.data["code"] == "invalid_otp"

    user.refresh_from_db()
    assert user.deleted_at is None


def test_mfa_account_is_deleted_with_a_valid_code(authed_client, user, mfa_secret):
    response = _delete(
        authed_client,
        password=DEFAULT_PASSWORD,
        code=_code(mfa_secret),
    )

    assert response.status_code == 200, response.data

    user.refresh_from_db()
    assert user.deleted_at is not None


def test_mfa_account_is_deleted_with_a_recovery_code(authed_client, user):
    secret = authed_client.post(reverse("v1:auth:mfa-enrol"), {}, format="json").data[
        "data"
    ]["secret"]

    codes = authed_client.post(
        reverse("v1:auth:mfa-confirm"),
        {"code": _code(secret)},
        format="json",
    ).data["data"]["codes"]

    response = _delete(authed_client, password=DEFAULT_PASSWORD, code=codes[0])

    assert response.status_code == 200, response.data


# ------------------------------------------------------------------------------
# Anonymization
# ------------------------------------------------------------------------------


def _deleted_days_ago(days: int) -> User:
    return DeletedUserFactory(deleted_at=timezone.now() - timedelta(days=days))


@override_settings(ACCOUNT_DELETION_GRACE_DAYS=30)
def test_only_accounts_past_the_grace_period_are_anonymized():
    expired = _deleted_days_ago(31)
    recent = _deleted_days_ago(29)
    active = UserFactory()

    assert anonymize_expired_deleted_accounts() == 1

    for account in (expired, recent, active):
        account.refresh_from_db()

    assert expired.anonymized_at is not None
    assert recent.anonymized_at is None
    assert active.anonymized_at is None


def test_anonymization_removes_identifying_data():
    user = _deleted_days_ago(40)
    original_email = user.email

    TOTPDevice.objects.create(user=user, secret="JBSWY3DPEHPK3PXP")
    RecoveryCode.objects.create(user=user, code_hash="0" * 64)
    SocialAccount.objects.create(
        user=user,
        provider="google",
        subject="123",
        email=original_email,
    )
    event = SecurityEvent.objects.create(
        user=user,
        event_type=SecurityEventTypeChoices.LOGIN,
        status="success",
        ip_address="203.0.113.7",
        user_agent="Mozilla/5.0",
        city="Kathmandu",
    )

    anonymize_account(user=user)

    user.refresh_from_db()
    event.refresh_from_db()

    assert user.email.endswith(f"@{ANONYMIZED_EMAIL_DOMAIN}")
    assert user.first_name == ""
    assert user.last_name == ""
    assert not user.has_usable_password()
    assert user.anonymized_at is not None

    assert not TOTPDevice.objects.filter(user=user).exists()
    assert not RecoveryCode.objects.filter(user=user).exists()
    assert not SocialAccount.objects.filter(user=user).exists()

    # The audit trail stays, without the network identifiers.
    assert event.ip_address is None
    assert event.user_agent == ""
    assert event.city == ""


def test_anonymization_scrubs_session_network_data(login):
    user = UserFactory()
    login(user)

    session = UserSession.objects.get(user=user)
    assert session.ip_address

    user.deleted_at = timezone.now() - timedelta(days=40)
    user.is_active = False
    user.save(update_fields=["deleted_at", "is_active"])

    anonymize_account(user=user)

    session.refresh_from_db()
    assert session.ip_address is None
    assert session.user_agent == ""


def test_anonymization_erases_profile_data():
    user = _deleted_days_ago(40)

    Profile.objects.filter(user=user).update(
        biography="About me",
        phone_number="+9779800000000",
    )
    Address.objects.create(
        user=user,
        street_address="1 Example Road",
        city="Pokhara",
        country="NP",
    )

    anonymize_account(user=user)

    profile = Profile.objects.get(user=user)
    assert profile.biography == ""
    assert str(profile.phone_number or "") == ""
    assert not Address.objects.filter(user=user).exists()


def test_the_original_email_can_register_again(api_client):
    user = _deleted_days_ago(40)
    email = user.email

    anonymize_account(user=user)

    response = api_client.post(
        reverse("v1:auth:register"),
        {
            "email": email,
            "password": DEFAULT_PASSWORD,
            "password_confirm": DEFAULT_PASSWORD,
            "first_name": "New",
            "last_name": "Person",
        },
        format="json",
    )

    assert response.status_code == 201, response.data


def test_anonymization_is_idempotent():
    user = _deleted_days_ago(40)

    anonymize_account(user=user)
    user.refresh_from_db()
    first = (user.email, user.anonymized_at)

    anonymize_account(user=user)
    user.refresh_from_db()

    assert (user.email, user.anonymized_at) == first


def test_an_active_account_cannot_be_anonymized(user):
    with pytest.raises(ValueError):
        anonymize_account(user=user)


def test_anonymization_task_is_scheduled(settings):
    tasks = {entry["task"] for entry in settings.CELERY_BEAT_SCHEDULE.values()}

    assert "apps.users.tasks.maintenance.anonymize_deleted_accounts" in tasks


# ------------------------------------------------------------------------------
# Google configuration
# ------------------------------------------------------------------------------


@pytest.fixture
def clean_registry():
    saved = dict(_REGISTRY)
    _REGISTRY.clear()
    yield
    _REGISTRY.clear()
    _REGISTRY.update(saved)


def test_google_registers_when_configured(settings, clean_registry):
    settings.GOOGLE_OAUTH_CLIENT_ID = "client-id"
    settings.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret"

    register_if_configured()

    assert "google" in available_providers()


def test_google_stays_off_without_credentials(settings, clean_registry):
    settings.GOOGLE_OAUTH_CLIENT_ID = ""
    settings.GOOGLE_OAUTH_CLIENT_SECRET = ""

    register_if_configured()

    assert "google" not in available_providers()


def test_half_a_google_configuration_fails_the_system_check(settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = "client-id"
    settings.GOOGLE_OAUTH_CLIENT_SECRET = ""

    ids = {message.id for message in run_checks()}

    assert "users.E001" in ids
