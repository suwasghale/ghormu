"""
Brute-force protection on Django's own authentication path.

The API login service verifies passwords directly and never calls
`django.contrib.auth.authenticate()`. A lockout implemented only there
leaves the admin login form - and every other session-based sign-in -
completely unprotected.
"""

from __future__ import annotations

import pytest
from django.contrib.auth import authenticate
from django.test import override_settings
from django.urls import reverse

from apps.users.services.auth.lockout import is_locked_out
from tests.factories import DEFAULT_PASSWORD, SuperUserFactory, UserFactory

pytestmark = pytest.mark.django_db

ADMIN_LOGIN = "/django-admin/login/"


def _attempt(client, email, password):
    return client.post(
        ADMIN_LOGIN,
        {
            "username": email,
            "password": password,
            "next": "/django-admin/",
        },
    )


# ------------------------------------------------------------------------------
# The backend itself
# ------------------------------------------------------------------------------


def test_authenticate_succeeds_with_valid_credentials(user):
    assert (
        authenticate(
            request=None,
            username=user.email,
            password=DEFAULT_PASSWORD,
        )
        == user
    )


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_authenticate_locks_the_account_after_repeated_failures(user):
    for _ in range(3):
        assert (
            authenticate(
                request=None,
                username=user.email,
                password="wrong-password-1",
            )
            is None
        )

    assert is_locked_out(email=user.email)

    # The correct password is now refused too.
    assert (
        authenticate(
            request=None,
            username=user.email,
            password=DEFAULT_PASSWORD,
        )
        is None
    )


def test_authenticate_clears_the_counter_on_success(user):
    authenticate(
        request=None,
        username=user.email,
        password="wrong-password-1",
    )

    authenticate(
        request=None,
        username=user.email,
        password=DEFAULT_PASSWORD,
    )

    assert not is_locked_out(email=user.email)


def test_authenticate_is_case_insensitive(user):
    assert (
        authenticate(
            request=None,
            username=user.email.upper(),
            password=DEFAULT_PASSWORD,
        )
        == user
    )


# ------------------------------------------------------------------------------
# The admin login form
# ------------------------------------------------------------------------------


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_admin_login_locks_out(client):
    """
    Regression: /admin/login/ had no brute-force protection whatsoever,
    while the API endpoint beside it allowed ten attempts.
    """

    admin = SuperUserFactory()

    for _ in range(3):
        _attempt(client, admin.email, "wrong-password-1")

    response = _attempt(client, admin.email, DEFAULT_PASSWORD)

    # Still on the login form rather than redirected into the admin.
    assert response.status_code == 200
    assert not response.wsgi_request.user.is_authenticated


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_admin_login_works_again_once_the_lock_is_cleared(client):
    from django.core.cache import cache

    admin = SuperUserFactory()

    for _ in range(3):
        _attempt(client, admin.email, "wrong-password-1")

    cache.clear()

    response = _attempt(client, admin.email, DEFAULT_PASSWORD)

    assert response.status_code == 302


# ------------------------------------------------------------------------------
# Shared budget
# ------------------------------------------------------------------------------


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_api_and_admin_share_one_failure_budget(client, api_client):
    """
    Two doors into the same account must not each grant a full budget,
    or the effective limit is double what is configured.
    """

    target = UserFactory()

    # Two failures through the admin form.
    for _ in range(2):
        _attempt(client, target.email, "wrong-password-1")

    # The third, through the API, trips the lock.
    response = api_client.post(
        reverse("v1:auth:login"),
        {"email": target.email, "password": "wrong-password-1"},
        format="json",
    )

    assert response.status_code == 401
    assert is_locked_out(email=target.email)


@override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
def test_api_lockout_also_blocks_the_admin(client, api_client):
    target = SuperUserFactory()

    for _ in range(3):
        api_client.post(
            reverse("v1:auth:login"),
            {"email": target.email, "password": "wrong-password-1"},
            format="json",
        )

    response = _attempt(client, target.email, DEFAULT_PASSWORD)

    assert response.status_code == 200
    assert not response.wsgi_request.user.is_authenticated
