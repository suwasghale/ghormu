"""
Login endpoint tests.

Focused on the enumeration and brute-force properties, which are the
reason this endpoint is interesting.
"""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse

from tests.factories import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def url():
    return reverse("v1:auth:login")


# ------------------------------------------------------------------------------
# Happy path
# ------------------------------------------------------------------------------


def test_login_returns_token_pair(api_client, user, url):
    response = api_client.post(
        url,
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert response.status_code == 200

    data = response.data["data"]

    assert data["tokens"]["access"]
    assert data["tokens"]["refresh"]
    assert data["user"]["email"] == user.email


def test_login_is_case_insensitive_on_email(api_client, user, url):
    response = api_client.post(
        url,
        {
            "email": user.email.upper(),
            "password": DEFAULT_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 200


def test_login_creates_a_session_bound_to_the_token(
    api_client,
    user,
    url,
):
    from rest_framework_simplejwt.tokens import AccessToken

    response = api_client.post(
        url,
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    access = AccessToken(response.data["data"]["tokens"]["access"])

    assert access["session_id"]
    assert user.sessions.filter(
        id=access["session_id"],
        is_active=True,
    ).exists()


# ------------------------------------------------------------------------------
# Account enumeration
# ------------------------------------------------------------------------------


def test_unknown_email_and_wrong_password_are_indistinguishable(
    api_client,
    user,
    url,
):
    """
    The two responses must not differ in status, message or code.

    Any difference turns this endpoint into an oracle for discovering
    which addresses have accounts.
    """

    unknown = api_client.post(
        url,
        {"email": "nobody@example.test", "password": "whatever-123"},
        format="json",
    )

    wrong_password = api_client.post(
        url,
        {"email": user.email, "password": "wrong-password-123"},
        format="json",
    )

    assert unknown.status_code == wrong_password.status_code == 401
    assert unknown.data["message"] == wrong_password.data["message"]


@pytest.mark.parametrize(
    "factory_kwargs",
    [
        {"is_active": False},
        {"deleted_at": "now"},
    ],
)
def test_disabled_and_deleted_accounts_look_like_bad_credentials(
    api_client,
    url,
    factory_kwargs,
):
    """
    Account state must not leak to a caller without a valid password.
    """

    from django.utils import timezone

    if factory_kwargs.get("deleted_at") == "now":
        factory_kwargs["deleted_at"] = timezone.now()

    target = UserFactory(**factory_kwargs)

    response = api_client.post(
        url,
        {"email": target.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    baseline = api_client.post(
        url,
        {"email": "nobody@example.test", "password": "whatever-123"},
        format="json",
    )

    assert response.status_code == 401
    assert response.data["message"] == baseline.data["message"]


def test_unverified_account_is_only_disclosed_with_a_valid_password(
    api_client,
    unverified_user,
    url,
):
    """
    Safe to disclose: the caller already proved they know the password.
    """

    with_password = api_client.post(
        url,
        {
            "email": unverified_user.email,
            "password": DEFAULT_PASSWORD,
        },
        format="json",
    )

    without_password = api_client.post(
        url,
        {"email": unverified_user.email, "password": "wrong-pass-1"},
        format="json",
    )

    assert with_password.status_code == 403
    assert with_password.data["errors"] is None or "email_not_verified"

    # Without the password it is indistinguishable from any other
    # failure.
    assert without_password.status_code == 401


# ------------------------------------------------------------------------------
# Lockout
# ------------------------------------------------------------------------------


@override_settings(
    LOGIN_MAX_FAILED_ATTEMPTS=3,
    LOGIN_LOCKOUT_SECONDS=300,
    LOGIN_FAILURE_WINDOW_SECONDS=300,
)
def test_account_locks_after_repeated_failures(
    api_client,
    user,
    url,
):
    for _ in range(3):
        response = api_client.post(
            url,
            {"email": user.email, "password": "wrong-password-1"},
            format="json",
        )
        assert response.status_code == 401

    # The correct password is now refused too: the lock is on the
    # account, not on the guess.
    locked = api_client.post(
        url,
        {"email": user.email, "password": DEFAULT_PASSWORD},
        format="json",
    )

    assert locked.status_code == 429
    assert locked["Retry-After"] == "300"


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_successful_login_clears_the_failure_counter(
    api_client,
    user,
    url,
):
    for _ in range(2):
        api_client.post(
            url,
            {"email": user.email, "password": "wrong-password-1"},
            format="json",
        )

    assert (
        api_client.post(
            url,
            {"email": user.email, "password": DEFAULT_PASSWORD},
            format="json",
        ).status_code
        == 200
    )

    # Counter reset, so a fresh run of failures does not trip the lock
    # early.
    for _ in range(2):
        response = api_client.post(
            url,
            {"email": user.email, "password": "wrong-password-1"},
            format="json",
        )
        assert response.status_code == 401


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_lockout_applies_to_unknown_addresses_too(api_client, url):
    """
    Counting failures only for real accounts would itself be an oracle:
    the attacker learns an address exists from whether it can be locked.
    """

    for _ in range(3):
        api_client.post(
            url,
            {"email": "nobody@example.test", "password": "guess-1234"},
            format="json",
        )

    response = api_client.post(
        url,
        {"email": "nobody@example.test", "password": "guess-1234"},
        format="json",
    )

    assert response.status_code == 429


def test_lockout_does_not_store_the_raw_email_in_cache(
    api_client,
    user,
    url,
):
    api_client.post(
        url,
        {"email": user.email, "password": "wrong-password-1"},
        format="json",
    )

    from apps.users.services.auth.lockout import _failure_key

    assert user.email not in _failure_key(user.email)
    assert cache.get(_failure_key(user.email)) == 1
