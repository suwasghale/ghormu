"""
Address endpoints.

The important property here is the ownership boundary: one user must
never be able to read, modify or even confirm the existence of
another's address.
"""

from __future__ import annotations

import uuid

import pytest
from django.urls import reverse

from apps.profiles.models import Address

pytestmark = pytest.mark.django_db


def _payload(**overrides):
    payload = {
        "address_type": "home",
        "label": "  Home  ",
        "street_address": "1 Example Street",
        "city": "Kathmandu",
        "state": "Bagmati",
        "postal_code": "44600",
        "country": "NP",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def list_url():
    return reverse("v1:profiles:address-list-create")


def detail_url(address_id):
    return reverse(
        "v1:profiles:address-detail",
        kwargs={"address_id": address_id},
    )


def default_url(address_id):
    return reverse(
        "v1:profiles:address-set-default",
        kwargs={"address_id": address_id},
    )


@pytest.fixture
def address(authed_client, list_url):
    response = authed_client.post(
        list_url,
        _payload(),
        format="json",
    )

    assert response.status_code == 201, response.data

    return response.data["data"]


@pytest.fixture
def foreign_address(other_user):
    """
    An address owned by somebody other than the authenticated user.
    """

    return Address.objects.create(
        user=other_user,
        address_type="home",
        label="Theirs",
        street_address="99 Other Road",
        city="Pokhara",
        state="Gandaki",
        postal_code="33700",
        country="NP",
    )


# ------------------------------------------------------------------------------
# Create and list
# ------------------------------------------------------------------------------


def test_create_address(authed_client, list_url):
    response = authed_client.post(
        list_url,
        _payload(),
        format="json",
    )

    assert response.status_code == 201
    assert response.data["data"]["label"] == "Home"


def test_first_address_becomes_default(address):
    assert address["is_default"] is True


def test_duplicate_address_type_is_rejected(
    authed_client,
    list_url,
    address,
):
    response = authed_client.post(
        list_url,
        _payload(),
        format="json",
    )

    assert response.status_code == 400


def test_list_returns_only_the_callers_addresses(
    authed_client,
    list_url,
    address,
    foreign_address,
):
    response = authed_client.get(list_url)

    assert response.status_code == 200

    returned = {item["id"] for item in response.data["data"]}

    assert returned == {address["id"]}


def test_creating_an_address_requires_authentication(
    api_client,
    list_url,
):
    response = api_client.post(
        list_url,
        _payload(),
        format="json",
    )

    assert response.status_code == 401


# ------------------------------------------------------------------------------
# Ownership boundary
# ------------------------------------------------------------------------------


def test_cannot_update_another_users_address(
    authed_client,
    foreign_address,
):
    """
    Regression: the lookup was unscoped, so this reached the service
    layer and was refused with 403 - which confirms the id is real.
    """

    response = authed_client.patch(
        detail_url(foreign_address.id),
        {"city": "Hijacked"},
        format="json",
    )

    assert response.status_code == 404

    foreign_address.refresh_from_db()

    assert foreign_address.city == "Pokhara"


def test_cannot_delete_another_users_address(
    authed_client,
    foreign_address,
):
    response = authed_client.delete(
        detail_url(foreign_address.id),
    )

    assert response.status_code == 404
    assert Address.objects.filter(pk=foreign_address.pk).exists()


def test_cannot_set_another_users_address_as_default(
    authed_client,
    foreign_address,
):
    response = authed_client.post(
        default_url(foreign_address.id),
        {},
        format="json",
    )

    assert response.status_code == 404


def test_foreign_and_unknown_addresses_are_indistinguishable(
    authed_client,
    foreign_address,
):
    """
    Both must answer identically or the endpoint reveals which ids
    exist.
    """

    foreign = authed_client.delete(detail_url(foreign_address.id))
    unknown = authed_client.delete(detail_url(uuid.uuid4()))

    assert foreign.status_code == unknown.status_code == 404
    assert foreign.data["message"] == unknown.data["message"]


def test_unknown_address_returns_404_not_500(authed_client):
    """
    Regression: the unscoped selector raised Address.DoesNotExist, which
    the exception handler did not map and surfaced as a 500.
    """

    response = authed_client.patch(
        detail_url(uuid.uuid4()),
        {"city": "Nowhere"},
        format="json",
    )

    assert response.status_code == 404


# ------------------------------------------------------------------------------
# Update, delete, default
# ------------------------------------------------------------------------------


def test_update_address(authed_client, address):
    response = authed_client.patch(
        detail_url(address["id"]),
        {"city": "Lalitpur"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["city"] == "Lalitpur"


def test_delete_address(authed_client, address):
    response = authed_client.delete(detail_url(address["id"]))

    assert response.status_code == 200
    assert not Address.objects.filter(id=address["id"]).exists()


def test_deleting_the_default_promotes_another(
    authed_client,
    list_url,
    address,
):
    second = authed_client.post(
        list_url,
        _payload(address_type="office", label="Office"),
        format="json",
    ).data["data"]

    authed_client.delete(detail_url(address["id"]))

    assert Address.objects.get(id=second["id"]).is_default is True


def test_setting_a_default_clears_the_previous_one(
    authed_client,
    list_url,
    address,
    user,
):
    second = authed_client.post(
        list_url,
        _payload(address_type="office", label="Office"),
        format="json",
    ).data["data"]

    response = authed_client.post(
        default_url(second["id"]),
        {},
        format="json",
    )

    assert response.status_code == 200

    defaults = Address.objects.filter(
        user=user,
        is_default=True,
    )

    assert defaults.count() == 1
    assert str(defaults.get().id) == second["id"]


def test_only_one_default_can_exist_per_user(user):
    """
    Enforced by a partial unique index, so a concurrent writer that
    skips the service layer still cannot create a second default.
    """

    from django.db import IntegrityError

    Address.objects.create(
        user=user,
        address_type="home",
        street_address="1 A Street",
        city="Kathmandu",
        postal_code="44600",
        country="NP",
        is_default=True,
    )

    with pytest.raises(IntegrityError):
        Address.objects.create(
            user=user,
            address_type="office",
            street_address="2 B Street",
            city="Kathmandu",
            postal_code="44600",
            country="NP",
            is_default=True,
        )
