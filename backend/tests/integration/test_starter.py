import pytest
from django.urls import reverse

from tests.factories import SuperUserFactory, UserFactory

pytestmark = pytest.mark.django_db


def test_dashboard_is_staff_only(api_client):
    url = "/api/v1/admin/dashboard/"
    assert api_client.get(url).status_code == 401
    api_client.force_authenticate(UserFactory())
    assert api_client.get(url).status_code == 403
    api_client.force_authenticate(SuperUserFactory())
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data["data"]["users"]["total"] == 2


def test_django_admin_has_a_separate_route():
    assert reverse("admin:login") == "/django-admin/login/"


def test_business_domains_are_not_installed(settings):
    assert not set(settings.INSTALLED_APPS) & {
        "apps.projects",
        "apps.sponsorship",
        "apps.content",
        "apps.catalog",
    }
