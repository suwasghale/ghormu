"""
Logout, refresh rotation and session revocation.

These cover the class of bug where a token keeps working after the user
believes it has been invalidated.
"""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import AccessToken

from tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def _bearer(client, access):
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return client


# ------------------------------------------------------------------------------
# Logout
# ------------------------------------------------------------------------------


def test_logout_succeeds(authed_client):
    """
    Regression: this endpoint raised TypeError on every call because the
    view passed `refresh=` to a service expecting `refresh_token=`.
    """

    response = authed_client.post(
        reverse("v1:auth:logout"),
        {"refresh": authed_client.refresh_token},
        format="json",
    )

    assert response.status_code == 200, response.data


def test_logout_blacklists_the_refresh_token(authed_client):
    authed_client.post(
        reverse("v1:auth:logout"),
        {"refresh": authed_client.refresh_token},
        format="json",
    )

    assert BlacklistedToken.objects.count() == 1


def test_logout_closes_the_session(authed_client, user):
    authed_client.post(
        reverse("v1:auth:logout"),
        {"refresh": authed_client.refresh_token},
        format="json",
    )

    assert not user.sessions.filter(is_active=True).exists()


def test_access_token_stops_working_immediately_after_logout(
    authed_client,
    django_capture_on_commit_callbacks,
):
    """
    The core revocation guarantee. A blacklisted refresh token alone
    leaves the access token valid until it expires.

    The cache write that enforces this is queued with on_commit, which
    pytest-django does not run inside a non-transactional test, so it is
    executed explicitly here.
    """

    with django_capture_on_commit_callbacks(execute=True):
        authed_client.post(
            reverse("v1:auth:logout"),
            {"refresh": authed_client.refresh_token},
            format="json",
        )

    response = authed_client.get(reverse("v1:auth:me"))

    assert response.status_code == 401


def test_cannot_logout_another_users_session(
    api_client,
    user,
    other_user,
    login,
):
    victim_tokens = login(other_user)["tokens"]
    attacker_tokens = login(user)["tokens"]

    _bearer(api_client, attacker_tokens["access"])

    response = api_client.post(
        reverse("v1:auth:logout"),
        {"refresh": victim_tokens["refresh"]},
        format="json",
    )

    assert response.status_code == 401
    assert other_user.sessions.filter(is_active=True).exists()


# ------------------------------------------------------------------------------
# Refresh rotation
# ------------------------------------------------------------------------------


def test_refresh_returns_a_new_pair(api_client, user, login):
    tokens = login(user)["tokens"]

    response = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    assert response.status_code == 200

    new_tokens = response.data["data"]

    assert new_tokens["refresh"] != tokens["refresh"]
    assert new_tokens["access"] != tokens["access"]


def test_refresh_preserves_the_session_binding(
    api_client,
    user,
    login,
):
    tokens = login(user)["tokens"]
    original_session = AccessToken(tokens["access"])["session_id"]

    response = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    rotated_session = AccessToken(
        response.data["data"]["access"],
    )["session_id"]

    assert rotated_session == original_session


def test_refresh_token_reuse_revokes_every_session(
    api_client,
    user,
    login,
):
    """
    Presenting an already-rotated refresh token means it was captured.
    """

    tokens = login(user)["tokens"]

    api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    replay = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    assert replay.status_code == 401
    assert not user.sessions.filter(is_active=True).exists()


def test_refresh_rejects_a_disabled_account(api_client, user, login):
    """
    Regression: nothing on the refresh path consulted the user record,
    so a disabled account could refresh forever.
    """

    tokens = login(user)["tokens"]

    user.is_active = False
    user.save(update_fields=["is_active"])

    response = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    assert response.status_code == 401


def test_refresh_rejects_a_revoked_session(api_client, user, login):
    tokens = login(user)["tokens"]

    user.sessions.update(is_active=False)

    response = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": tokens["refresh"]},
        format="json",
    )

    assert response.status_code == 401


def test_refresh_with_unknown_token_returns_401_not_500(api_client):
    """
    Regression: an OutstandingToken with no matching session raised an
    unhandled DoesNotExist.
    """

    orphan = str(
        AccessToken.for_user(UserFactory()),
    )

    response = api_client.post(
        reverse("v1:auth:token-refresh"),
        {"refresh": orphan},
        format="json",
    )

    assert response.status_code == 401


# ------------------------------------------------------------------------------
# Logout all
# ------------------------------------------------------------------------------


def test_logout_all_closes_every_session(api_client, user, login):
    first = login(user)["tokens"]
    login(user)
    login(user)

    assert user.sessions.filter(is_active=True).count() == 3

    _bearer(api_client, first["access"])

    response = api_client.post(
        reverse("v1:auth:logout-all"),
        {},
        format="json",
    )

    assert response.status_code == 200
    assert not user.sessions.filter(is_active=True).exists()
    assert (
        BlacklistedToken.objects.count()
        == OutstandingToken.objects.filter(user=user).count()
    )


# ------------------------------------------------------------------------------
# Session management endpoints
# ------------------------------------------------------------------------------


def test_session_list_marks_the_current_session(authed_client):
    response = authed_client.get(reverse("v1:auth:security:sessions"))

    assert response.status_code == 200, response.data


def test_revoking_an_unknown_session_returns_404_not_500(
    authed_client,
):
    """
    Regression: the view dereferenced a None from the selector.
    """

    import uuid

    response = authed_client.delete(
        reverse(
            "v1:auth:security:session-revoke",
            kwargs={"session_id": uuid.uuid4()},
        ),
    )

    assert response.status_code == 404


def test_cannot_revoke_another_users_session(
    api_client,
    user,
    other_user,
    login,
):
    victim = login(other_user)
    attacker_tokens = login(user)["tokens"]

    victim_session_id = AccessToken(
        victim["tokens"]["access"],
    )["session_id"]

    _bearer(api_client, attacker_tokens["access"])

    response = api_client.delete(
        reverse(
            "v1:auth:security:session-revoke",
            kwargs={"session_id": victim_session_id},
        ),
    )

    assert response.status_code == 404
    assert other_user.sessions.filter(is_active=True).exists()


def test_revoking_a_session_kills_its_access_token(
    api_client,
    user,
    login,
    django_capture_on_commit_callbacks,
):
    first = login(user)["tokens"]
    second = login(user)["tokens"]

    second_session_id = AccessToken(second["access"])["session_id"]

    _bearer(api_client, first["access"])

    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.delete(
            reverse(
                "v1:auth:security:session-revoke",
                kwargs={"session_id": second_session_id},
            ),
        )

    assert response.status_code == 200

    # The revoked device's still-unexpired access token is now refused.
    _bearer(api_client, second["access"])

    assert api_client.get(reverse("v1:auth:me")).status_code == 401


def test_cannot_revoke_the_current_session(authed_client):
    session_id = AccessToken(
        authed_client.access_token,
    )["session_id"]

    response = authed_client.delete(
        reverse(
            "v1:auth:security:session-revoke",
            kwargs={"session_id": session_id},
        ),
    )

    assert response.status_code == 400
