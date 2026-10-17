"""
Social sign-in.

The decisions here are what separate a convenience feature from an
account-takeover route: whether an unverified provider address may
claim a local account, and whether state is actually enforced.
"""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework.test import APIRequestFactory

from apps.users.models import SocialAccount, User
from apps.users.services.auth.social import (
    SocialProfile,
    SocialProvider,
    register_provider,
)
from apps.users.services.auth.social.login import (
    login_with_social_profile,
)

pytestmark = pytest.mark.django_db


def _profile(
    *,
    email="social@example.test",
    verified=True,
    subject="provider-subject-1",
    provider="stub",
):
    return SocialProfile(
        provider=provider,
        subject=subject,
        email=email,
        email_verified=verified,
        first_name="Ada",
        last_name="Lovelace",
    )


def _login(profile, *, provider_verifies=True):
    return login_with_social_profile(
        request=APIRequestFactory().post("/"),
        profile=profile,
        provider_verifies_email=provider_verifies,
    )


# ------------------------------------------------------------------------------
# Account creation
# ------------------------------------------------------------------------------


def test_verified_profile_creates_an_account():
    result = _login(_profile())

    assert result.tokens.access

    user = User.objects.get(email="social@example.test")

    assert user.is_verified is True
    assert not user.has_usable_password()
    assert SocialAccount.objects.filter(user=user).count() == 1


def test_unverified_provider_email_cannot_create_an_account():
    """
    Otherwise anyone able to register at the provider can pre-claim a
    victim's address.
    """

    from apps.users.exceptions.authentication import (
        SocialEmailNotVerified,
    )

    with pytest.raises(SocialEmailNotVerified):
        _login(_profile(verified=False))

    assert not User.objects.filter(
        email="social@example.test",
    ).exists()


def test_a_provider_that_never_verifies_is_not_trusted():
    """
    Even a profile claiming `email_verified` is refused when the
    provider itself does not verify addresses.
    """

    from apps.users.exceptions.authentication import (
        SocialEmailNotVerified,
    )

    with pytest.raises(SocialEmailNotVerified):
        _login(_profile(verified=True), provider_verifies=False)


# ------------------------------------------------------------------------------
# Linking
# ------------------------------------------------------------------------------


def test_verified_profile_links_to_an_existing_account(user):
    result = _login(_profile(email=user.email))

    assert result.user.id == user.id
    assert SocialAccount.objects.filter(user=user).count() == 1


def test_unverified_profile_cannot_hijack_an_existing_account(user):
    """
    The takeover case: an attacker registers the victim's address at a
    provider that does not confirm it, then signs in here.
    """

    from apps.users.exceptions.authentication import (
        SocialEmailNotVerified,
    )

    with pytest.raises(SocialEmailNotVerified):
        _login(_profile(email=user.email, verified=False))

    assert not SocialAccount.objects.exists()


def test_existing_link_wins_over_email_matching(user):
    """
    Keyed on the provider subject, so a changed provider email still
    lands on the same local account.
    """

    _login(_profile(email=user.email))

    result = _login(
        _profile(email="changed@example.test", subject="provider-subject-1"),
    )

    assert result.user.id == user.id
    assert User.objects.count() == 1


def test_a_disabled_account_cannot_sign_in(user):
    from apps.users.exceptions.authentication import InvalidCredentials

    _login(_profile(email=user.email))

    user.is_active = False
    user.save(update_fields=["is_active"])

    with pytest.raises(InvalidCredentials):
        _login(_profile(email=user.email))


def test_one_local_account_per_provider_identity(user, other_user):
    """
    The same provider identity must not link to two local users, or
    sign-in becomes ambiguous.
    """

    from django.db import IntegrityError

    _login(_profile(email=user.email))

    with pytest.raises(IntegrityError):
        SocialAccount.objects.create(
            user=other_user,
            provider="stub",
            subject="provider-subject-1",
        )


# ------------------------------------------------------------------------------
# MFA
# ------------------------------------------------------------------------------


def test_social_signin_does_not_bypass_mfa(user):
    """
    A provider proves control of a third-party account, which is the
    thing a second factor exists to backstop.
    """

    import pyotp

    from apps.users.exceptions.authentication import MFARequired
    from apps.users.services.auth.mfa import (
        confirm_totp_enrolment,
        start_totp_enrolment,
    )

    enrolment = start_totp_enrolment(user=user)
    confirm_totp_enrolment(
        user=user,
        code=pyotp.TOTP(enrolment.secret, interval=30).now(),
    )

    with pytest.raises(MFARequired):
        _login(_profile(email=user.email))


# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------


class StubProvider(SocialProvider):
    name = "stub"
    verifies_email = True

    def build_authorization_url(self, *, state, redirect_uri):
        return f"https://provider.test/auth?state={state}"

    def exchange_code(self, *, code, redirect_uri):
        return {"access_token": "stub"}

    def fetch_profile(self, *, tokens):
        return _profile()


@pytest.fixture
def stub_provider(settings):
    settings.CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
    from apps.users.services.auth.social import base

    register_provider(StubProvider())
    yield
    base._REGISTRY.pop("stub", None)


def test_provider_list_is_empty_by_default(api_client):
    response = api_client.get(reverse("v1:auth:social-providers"))

    assert response.status_code == 200
    assert response.data["data"]["providers"] == []


def test_authorize_returns_a_url_and_state(api_client, stub_provider):
    response = api_client.post(
        reverse(
            "v1:auth:social-authorize",
            kwargs={"provider": "stub"},
        ),
        {"redirect_uri": "http://localhost:3000/callback"},
        format="json",
    )

    assert response.status_code == 200, response.data
    assert response.data["data"]["state"]
    assert response.data["data"]["authorization_url"].startswith(
        "https://provider.test/",
    )


def test_an_unlisted_redirect_uri_is_refused(
    api_client,
    stub_provider,
):
    """
    An unvalidated redirect_uri is an open redirect carrying an
    authorization code: the attacker supplies their own callback and
    exchanges the code themselves.
    """

    response = api_client.post(
        reverse(
            "v1:auth:social-authorize",
            kwargs={"provider": "stub"},
        ),
        {"redirect_uri": "https://attacker.test/steal"},
        format="json",
    )

    assert response.status_code == 400


def test_unknown_provider_returns_404(api_client):
    response = api_client.post(
        reverse(
            "v1:auth:social-authorize",
            kwargs={"provider": "nope"},
        ),
        {"redirect_uri": "http://localhost:3000/callback"},
        format="json",
    )

    assert response.status_code == 404


def test_callback_completes_sign_in(api_client, stub_provider):
    state = api_client.post(
        reverse(
            "v1:auth:social-authorize",
            kwargs={"provider": "stub"},
        ),
        {"redirect_uri": "http://localhost:3000/callback"},
        format="json",
    ).data["data"]["state"]

    response = api_client.post(
        reverse(
            "v1:auth:social-callback",
            kwargs={"provider": "stub"},
        ),
        {"code": "auth-code", "state": state},
        format="json",
    )

    assert response.status_code == 200, response.data
    assert response.data["data"]["tokens"]["access"]


def test_callback_rejects_a_forged_state(api_client, stub_provider):
    response = api_client.post(
        reverse(
            "v1:auth:social-callback",
            kwargs={"provider": "stub"},
        ),
        {"code": "auth-code", "state": "not-issued"},
        format="json",
    )

    assert response.status_code == 400


def test_state_cannot_be_replayed(api_client, stub_provider):
    state = api_client.post(
        reverse(
            "v1:auth:social-authorize",
            kwargs={"provider": "stub"},
        ),
        {"redirect_uri": "http://localhost:3000/callback"},
        format="json",
    ).data["data"]["state"]

    payload = {"code": "auth-code", "state": state}
    url = reverse(
        "v1:auth:social-callback",
        kwargs={"provider": "stub"},
    )

    assert (
        api_client.post(
            url,
            payload,
            format="json",
        ).status_code
        == 200
    )

    assert (
        api_client.post(
            url,
            payload,
            format="json",
        ).status_code
        == 400
    )
