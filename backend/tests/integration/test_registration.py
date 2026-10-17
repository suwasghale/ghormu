"""
Registration and email verification.
"""

from __future__ import annotations

import pytest
from django.core import mail
from django.urls import reverse

from apps.users.models import User
from apps.users.models.tokens import EmailVerificationToken
from tests.factories import UserFactory

pytestmark = pytest.mark.django_db

PASSWORD = "Str0ng-Testing-Pass!42"


@pytest.fixture
def payload():
    return {
        "email": "New.User@Example.test",
        "first_name": "New",
        "last_name": "User",
        "password": PASSWORD,
        "password_confirm": PASSWORD,
    }


# ------------------------------------------------------------------------------
# Registration
# ------------------------------------------------------------------------------


def test_registration_creates_an_unverified_user(
    api_client,
    payload,
    django_capture_on_commit_callbacks,
):
    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.post(
            reverse("v1:auth:register"),
            payload,
            format="json",
        )

    assert response.status_code == 201, response.data

    user = User.objects.get()

    assert user.is_verified is False
    assert user.is_active is True
    assert len(mail.outbox) == 1


def test_registration_normalizes_the_email(api_client, payload):
    api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    assert User.objects.get().email == "new.user@example.test"


def test_registration_never_returns_the_password(
    api_client,
    payload,
):
    response = api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    body = str(response.data)

    assert PASSWORD not in body
    assert "password" not in response.data.get("data", {})


def test_registration_rejects_a_duplicate_email(
    api_client,
    payload,
):
    UserFactory(email="new.user@example.test")

    response = api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    assert response.status_code == 400


def test_registration_rejects_a_case_variant_duplicate(
    api_client,
    payload,
):
    """
    Without normalization two accounts could exist that differ only in
    case, and only one of them would ever be able to sign in.
    """

    UserFactory(email="new.user@example.test")

    payload["email"] = "NEW.USER@EXAMPLE.TEST"

    response = api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    assert response.status_code == 400


def test_registration_rejects_mismatched_confirmation(
    api_client,
    payload,
):
    payload["password_confirm"] = "something-else-99"

    response = api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    assert response.status_code == 400


def test_registration_rejects_a_weak_password(api_client, payload):
    payload["password"] = "password"
    payload["password_confirm"] = "password"

    response = api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    assert response.status_code == 400


def test_unverified_user_cannot_log_in(
    api_client,
    payload,
):
    api_client.post(
        reverse("v1:auth:register"),
        payload,
        format="json",
    )

    response = api_client.post(
        reverse("v1:auth:login"),
        {
            "email": payload["email"],
            "password": PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 403


# ------------------------------------------------------------------------------
# Email verification
# ------------------------------------------------------------------------------


def test_verification_marks_the_user_verified(
    api_client,
    unverified_user,
):
    """
    Drives the flow through the service so the raw token is available.
    """

    from core.security.tokens import generate_hashed_token

    raw_token, token_hash = generate_hashed_token()

    from datetime import timedelta

    from django.utils import timezone

    EmailVerificationToken.objects.create(
        user=unverified_user,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(hours=1),
    )

    response = api_client.post(
        reverse("v1:auth:email-verify"),
        {"token": raw_token},
        format="json",
    )

    assert response.status_code == 200, response.data

    unverified_user.refresh_from_db()

    assert unverified_user.is_verified is True


def test_verification_token_is_single_use(
    api_client,
    unverified_user,
):
    from datetime import timedelta

    from django.utils import timezone

    from core.security.tokens import generate_hashed_token

    raw_token, token_hash = generate_hashed_token()

    EmailVerificationToken.objects.create(
        user=unverified_user,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(hours=1),
    )

    payload = {"token": raw_token}

    assert (
        api_client.post(
            reverse("v1:auth:email-verify"),
            payload,
            format="json",
        ).status_code
        == 200
    )

    assert (
        api_client.post(
            reverse("v1:auth:email-verify"),
            payload,
            format="json",
        ).status_code
        == 400
    )


def test_expired_verification_token_is_rejected(
    api_client,
    unverified_user,
):
    from datetime import timedelta

    from django.utils import timezone

    from core.security.tokens import generate_hashed_token

    raw_token, token_hash = generate_hashed_token()

    EmailVerificationToken.objects.create(
        user=unverified_user,
        token_hash=token_hash,
        expires_at=timezone.now() - timedelta(minutes=1),
    )

    response = api_client.post(
        reverse("v1:auth:email-verify"),
        {"token": raw_token},
        format="json",
    )

    assert response.status_code == 400

    unverified_user.refresh_from_db()

    assert unverified_user.is_verified is False


def test_verification_rejects_an_unknown_token(api_client):
    response = api_client.post(
        reverse("v1:auth:email-verify"),
        {"token": "not-a-real-token"},
        format="json",
    )

    assert response.status_code == 400


# ------------------------------------------------------------------------------
# Resend verification
# ------------------------------------------------------------------------------


def test_resend_does_not_disclose_account_existence(
    api_client,
    unverified_user,
):
    known = api_client.post(
        reverse("v1:auth:email-resend"),
        {"email": unverified_user.email},
        format="json",
    )

    unknown = api_client.post(
        reverse("v1:auth:email-resend"),
        {"email": "nobody@example.test"},
        format="json",
    )

    assert known.status_code == unknown.status_code == 200
    assert known.data["message"] == unknown.data["message"]


def test_resend_sends_nothing_for_a_verified_account(
    api_client,
    user,
    django_capture_on_commit_callbacks,
):
    with django_capture_on_commit_callbacks(execute=True):
        api_client.post(
            reverse("v1:auth:email-resend"),
            {"email": user.email},
            format="json",
        )

    assert not mail.outbox
