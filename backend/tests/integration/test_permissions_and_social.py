"""
Permission primitives and the social sign-in seam.
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import Group
from rest_framework.test import APIRequestFactory

from core.api.permissions import (
    HasGroup,
    IsOwner,
    IsOwnerOrReadOnly,
    IsStaff,
    IsVerified,
)
from tests.factories import StaffUserFactory, UnverifiedUserFactory

pytestmark = pytest.mark.django_db


def _request(user, method="get"):
    request = getattr(APIRequestFactory(), method)("/")
    request.user = user
    return request


# ------------------------------------------------------------------------------
# Ownership
# ------------------------------------------------------------------------------


def test_is_owner_allows_the_owner(user):
    from apps.profiles.models import Address

    address = Address.objects.create(
        user=user,
        address_type="home",
        street_address="1 St",
        city="KTM",
        postal_code="44600",
        country="NP",
    )

    assert IsOwner().has_object_permission(
        _request(user),
        None,
        address,
    )


def test_is_owner_refuses_a_stranger(user, other_user):
    from apps.profiles.models import Address

    address = Address.objects.create(
        user=other_user,
        address_type="home",
        street_address="1 St",
        city="KTM",
        postal_code="44600",
        country="NP",
    )

    assert not IsOwner().has_object_permission(
        _request(user),
        None,
        address,
    )


def test_is_owner_handles_the_user_record_itself(user, other_user):
    """
    A User has no `user_id`; the owner is the row.
    """

    assert IsOwner().has_object_permission(_request(user), None, user)
    assert not IsOwner().has_object_permission(
        _request(user),
        None,
        other_user,
    )


def test_read_only_variant_allows_reads_but_not_writes(
    user,
    other_user,
):
    permission = IsOwnerOrReadOnly()

    assert permission.has_object_permission(
        _request(user, "get"),
        None,
        other_user,
    )
    assert not permission.has_object_permission(
        _request(user, "post"),
        None,
        other_user,
    )


# ------------------------------------------------------------------------------
# Status
# ------------------------------------------------------------------------------


def test_is_verified(user):
    assert IsVerified().has_permission(_request(user), None)

    unverified = UnverifiedUserFactory()

    assert not IsVerified().has_permission(_request(unverified), None)


def test_is_staff(user):
    assert not IsStaff().has_permission(_request(user), None)
    assert IsStaff().has_permission(
        _request(StaffUserFactory()),
        None,
    )


# ------------------------------------------------------------------------------
# Groups
# ------------------------------------------------------------------------------


def test_has_group(user):
    editors = HasGroup.named("editors")

    assert not editors().has_permission(_request(user), None)

    user.groups.add(Group.objects.create(name="editors"))

    assert editors().has_permission(_request(user), None)


def test_superuser_passes_any_group_check(user):
    user.is_superuser = True

    assert HasGroup.named("anything")().has_permission(
        _request(user),
        None,
    )


def test_group_membership_is_queried_once_per_request(
    user,
    django_assert_num_queries,
):
    user.groups.add(Group.objects.create(name="editors"))

    request = _request(user)
    permission = HasGroup.named("editors")()

    with django_assert_num_queries(1):
        permission.has_permission(request, None)
        permission.has_permission(request, None)
        permission.has_permission(request, None)


# ------------------------------------------------------------------------------
# MFA-verified sessions
# ------------------------------------------------------------------------------


def test_mfa_verified_flag_is_set_by_the_mfa_login_path(user):
    """
    `UserSession.mfa_verified` used to be a field nothing ever wrote.
    """

    from apps.users.services.auth.issue_session import issue_session

    request = APIRequestFactory().post("/")

    plain = issue_session(request=request, user=user)
    with_mfa = issue_session(
        request=request,
        user=user,
        mfa_verified=True,
    )

    from rest_framework_simplejwt.tokens import AccessToken

    from apps.users.models import UserSession

    plain_id = AccessToken(plain.tokens.access)["session_id"]
    mfa_id = AccessToken(with_mfa.tokens.access)["session_id"]

    assert UserSession.objects.get(id=plain_id).mfa_verified is False
    assert UserSession.objects.get(id=mfa_id).mfa_verified is True


# ------------------------------------------------------------------------------
# Social seam
# ------------------------------------------------------------------------------


def test_state_is_single_use():
    """
    Replaying state must fail, or it provides no CSRF protection.
    """

    from apps.users.services.auth.social import (
        consume_state,
        issue_state,
    )

    state = issue_state(
        provider="google",
        redirect_uri="https://app.example.test/callback",
    )

    assert consume_state(state=state) is not None
    assert consume_state(state=state) is None


def test_unknown_state_is_rejected():
    from apps.users.services.auth.social import consume_state

    assert consume_state(state="never-issued") is None


def test_no_provider_is_registered_by_default():
    """
    A provider that ships enabled but unconfigured fails at runtime
    with a confusing error. Registration is deliberate.
    """

    from apps.users.services.auth.social import available_providers

    assert available_providers() == []


def test_google_declares_that_it_verifies_email():
    from apps.users.services.auth.social.google import GoogleProvider

    assert GoogleProvider().verifies_email is True
    assert GoogleProvider().name == "google"


def test_a_provider_must_have_a_name():
    from apps.users.services.auth.social import (
        SocialProvider,
        register_provider,
    )

    class Nameless(SocialProvider):
        def build_authorization_url(self, *, state, redirect_uri):
            return ""

        def exchange_code(self, *, code, redirect_uri):
            return {}

        def fetch_profile(self, *, tokens):
            raise NotImplementedError

    with pytest.raises(ValueError):
        register_provider(Nameless())
