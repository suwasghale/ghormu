"""
Shared pytest fixtures.
"""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from tests.factories import (
    DEFAULT_PASSWORD,
    DeletedUserFactory,
    InactiveUserFactory,
    UnverifiedUserFactory,
    UserFactory,
)

# ------------------------------------------------------------------------------
# Isolation
# ------------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_cache():
    """
    Clear the cache around every test.

    Login lockouts and session revocation state live in the cache, so a
    leaked entry from one test silently changes the outcome of another.
    """

    cache.clear()
    yield
    cache.clear()


# ------------------------------------------------------------------------------
# Clients
# ------------------------------------------------------------------------------


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def password() -> str:
    return DEFAULT_PASSWORD


# ------------------------------------------------------------------------------
# Users
# ------------------------------------------------------------------------------


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def other_user(db):
    return UserFactory()


@pytest.fixture
def unverified_user(db):
    return UnverifiedUserFactory()


@pytest.fixture
def inactive_user(db):
    return InactiveUserFactory()


@pytest.fixture
def deleted_user(db):
    return DeletedUserFactory()


# ------------------------------------------------------------------------------
# Authentication helpers
# ------------------------------------------------------------------------------


@pytest.fixture
def login(api_client):
    """
    Log a user in through the real endpoint and return the payload.

    Going through the endpoint rather than minting tokens directly means
    the tests exercise session creation and claim binding the same way
    a client does.
    """

    def _login(user_obj, raw_password=DEFAULT_PASSWORD):
        response = api_client.post(
            reverse("v1:auth:login"),
            {
                "email": user_obj.email,
                "password": raw_password,
            },
            format="json",
        )

        assert response.status_code == 200, response.data

        return response.data["data"]

    return _login


@pytest.fixture
def authed_client(api_client, user, login):
    """
    An APIClient carrying a valid access token.
    """

    tokens = login(user)["tokens"]

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {tokens['access']}",
    )

    api_client.refresh_token = tokens["refresh"]
    api_client.access_token = tokens["access"]

    return api_client
