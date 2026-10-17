"""
Password change and reset.

The property under test throughout: after a password changes, tokens
issued before the change must stop working.
"""

from __future__ import annotations

import pytest
from django.core import mail
from django.urls import reverse

from apps.users.models.tokens import PasswordResetToken
from tests.factories import DEFAULT_PASSWORD

pytestmark = pytest.mark.django_db

NEW_PASSWORD = "An0ther-Str0ng-Pass!77"


# ------------------------------------------------------------------------------
# Change password
# ------------------------------------------------------------------------------


def test_change_password_updates_the_credential(
    authed_client,
    user,
):
    response = authed_client.post(
        reverse("v1:auth:password-change"),
        {
            "current_password": DEFAULT_PASSWORD,
            "new_password": NEW_PASSWORD,
            "confirm_password": NEW_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 200, response.data

    user.refresh_from_db()

    assert user.check_password(NEW_PASSWORD)


def test_change_password_rejects_a_wrong_current_password(
    authed_client,
):
    response = authed_client.post(
        reverse("v1:auth:password-change"),
        {
            "current_password": "not-the-password",
            "new_password": NEW_PASSWORD,
            "confirm_password": NEW_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400


def test_change_password_revokes_other_sessions(
    api_client,
    user,
    login,
    django_capture_on_commit_callbacks,
):
    """
    Regression: session revocation was commented out, so a stolen token
    survived a password change.
    """

    other_device = login(user)["tokens"]
    current = login(user)["tokens"]

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {current['access']}",
    )

    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.post(
            reverse("v1:auth:password-change"),
            {
                "current_password": DEFAULT_PASSWORD,
                "new_password": NEW_PASSWORD,
                "confirm_password": NEW_PASSWORD,
            },
            format="json",
        )

    assert response.status_code == 200

    # The other device is locked out.
    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {other_device['access']}",
    )

    assert api_client.get(reverse("v1:auth:me")).status_code == 401


def test_change_password_returns_working_replacement_tokens(
    authed_client,
    django_capture_on_commit_callbacks,
):
    """
    Changing a password invalidates every token, including the caller's
    own, so the endpoint must hand back a usable replacement pair.
    """

    with django_capture_on_commit_callbacks(execute=True):
        response = authed_client.post(
            reverse("v1:auth:password-change"),
            {
                "current_password": DEFAULT_PASSWORD,
                "new_password": NEW_PASSWORD,
                "confirm_password": NEW_PASSWORD,
            },
            format="json",
        )

    tokens = response.data["data"]["tokens"]

    # The pair the caller arrived with is dead.
    assert (
        authed_client.get(
            reverse("v1:auth:me"),
        ).status_code
        == 401
    )

    # The replacement works.
    authed_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {tokens['access']}",
    )

    assert (
        authed_client.get(
            reverse("v1:auth:me"),
        ).status_code
        == 200
    )


def test_change_password_rejects_reuse(authed_client):
    response = authed_client.post(
        reverse("v1:auth:password-change"),
        {
            "current_password": DEFAULT_PASSWORD,
            "new_password": DEFAULT_PASSWORD,
            "confirm_password": DEFAULT_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400


# ------------------------------------------------------------------------------
# Forgot password
# ------------------------------------------------------------------------------


def test_forgot_password_sends_a_token(
    api_client,
    user,
    django_capture_on_commit_callbacks,
):
    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.post(
            reverse("v1:auth:password-forgot"),
            {"email": user.email},
            format="json",
        )

    assert response.status_code == 200
    assert PasswordResetToken.objects.filter(user=user).count() == 1
    assert len(mail.outbox) == 1


def test_forgot_password_does_not_disclose_unknown_addresses(
    api_client,
    user,
):
    known = api_client.post(
        reverse("v1:auth:password-forgot"),
        {"email": user.email},
        format="json",
    )

    unknown = api_client.post(
        reverse("v1:auth:password-forgot"),
        {"email": "nobody@example.test"},
        format="json",
    )

    assert known.status_code == unknown.status_code == 200
    assert known.data["message"] == unknown.data["message"]


def test_forgot_password_ignores_deleted_accounts(
    api_client,
    deleted_user,
    django_capture_on_commit_callbacks,
):
    with django_capture_on_commit_callbacks(execute=True):
        api_client.post(
            reverse("v1:auth:password-forgot"),
            {"email": deleted_user.email},
            format="json",
        )

    assert not PasswordResetToken.objects.exists()
    assert not mail.outbox


# ------------------------------------------------------------------------------
# Reset password
# ------------------------------------------------------------------------------


@pytest.fixture
def reset_token(user):
    """
    Issue a reset token and return its raw value.
    """

    from apps.users.services.tokens.password_reset import (
        create_password_reset_token,
    )

    return create_password_reset_token(user=user).raw_token


def test_reset_password_sets_the_new_credential(
    api_client,
    user,
    reset_token,
):
    response = api_client.post(
        reverse("v1:auth:password-reset"),
        {
            "token": reset_token,
            "password": NEW_PASSWORD,
            "password_confirm": NEW_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 200, response.data

    user.refresh_from_db()

    assert user.check_password(NEW_PASSWORD)


def test_reset_token_is_single_use(api_client, reset_token):
    payload = {
        "token": reset_token,
        "password": NEW_PASSWORD,
        "password_confirm": NEW_PASSWORD,
    }

    assert (
        api_client.post(
            reverse("v1:auth:password-reset"),
            payload,
            format="json",
        ).status_code
        == 200
    )

    assert (
        api_client.post(
            reverse("v1:auth:password-reset"),
            payload,
            format="json",
        ).status_code
        == 400
    )


def test_reset_password_revokes_existing_sessions(
    api_client,
    user,
    login,
    reset_token,
    django_capture_on_commit_callbacks,
):
    """
    A reset is how a user recovers a compromised account. If the
    attacker's tokens outlive it, the reset achieved nothing.
    """

    stolen = login(user)["tokens"]

    with django_capture_on_commit_callbacks(execute=True):
        api_client.post(
            reverse("v1:auth:password-reset"),
            {
                "token": reset_token,
                "password": NEW_PASSWORD,
                "password_confirm": NEW_PASSWORD,
            },
            format="json",
        )

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {stolen['access']}",
    )

    assert api_client.get(reverse("v1:auth:me")).status_code == 401


def test_reset_password_rejects_an_unknown_token(api_client):
    response = api_client.post(
        reverse("v1:auth:password-reset"),
        {
            "token": "not-a-real-token",
            "password": NEW_PASSWORD,
            "password_confirm": NEW_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400


def test_reset_password_requires_matching_confirmation(
    api_client,
    reset_token,
):
    response = api_client.post(
        reverse("v1:auth:password-reset"),
        {
            "token": reset_token,
            "password": NEW_PASSWORD,
            "password_confirm": "something-else-99",
        },
        format="json",
    )

    assert response.status_code == 400
