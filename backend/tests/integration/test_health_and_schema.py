"""
Health probes and API schema.
"""

from __future__ import annotations

import pytest
from django.test import override_settings
from django.urls import reverse

pytestmark = pytest.mark.django_db


# ------------------------------------------------------------------------------
# Health
# ------------------------------------------------------------------------------


def test_liveness_needs_no_authentication(api_client):
    response = api_client.get(reverse("health-live"))

    assert response.status_code == 200
    assert response.data["status"] == "ok"


def test_readiness_reports_dependencies(api_client):
    response = api_client.get(reverse("health-ready"))

    assert response.status_code == 200
    assert response.data["checks"]["database"] is True
    assert response.data["checks"]["cache"] is True


def test_readiness_returns_503_when_a_dependency_is_down(
    api_client,
    monkeypatch,
):
    """
    A degraded dependency must fail readiness, not liveness: the pod
    should leave the load balancer, not be restarted.
    """

    monkeypatch.setattr(
        "core.api.health.ReadinessAPIView._check_database",
        staticmethod(lambda: False),
    )

    response = api_client.get(reverse("health-ready"))

    assert response.status_code == 503
    assert response.data["status"] == "degraded"

    # Liveness is unaffected.
    assert api_client.get(reverse("health-live")).status_code == 200


# ------------------------------------------------------------------------------
# Schema
# ------------------------------------------------------------------------------


def test_openapi_schema_is_not_empty(api_client):
    """
    Regression: with NamespaceVersioning and no `api_version` on the
    view, drf-spectacular emitted `paths: {}` - a valid but empty
    schema, which client generators accept without complaint.
    """

    response = api_client.get(reverse("schema"))

    assert response.status_code == 200

    body = response.content.decode()

    assert "/api/v1/auth/login/" in body
    assert "paths: {}" not in body


def test_schema_covers_every_api_endpoint(api_client):
    import yaml

    body = api_client.get(reverse("schema")).content.decode()
    paths = yaml.safe_load(body)["paths"]

    expected = {
        "/api/v1/auth/login/",
        "/api/v1/auth/logout/",
        "/api/v1/auth/refresh/",
        "/api/v1/auth/register/",
        "/api/v1/auth/me/",
        "/api/v1/me/profile/",
        "/api/v1/me/addresses/",
        "/api/v1/auth/security/sessions/",
    }

    assert expected <= set(paths)


@override_settings(ENABLE_API_DOCS=True)
def test_swagger_ui_is_reachable_when_enabled(api_client):
    response = api_client.get(reverse("swagger-ui"))

    assert response.status_code == 200


def test_authenticated_endpoints_advertise_a_security_scheme(
    api_client,
):
    """
    Regression: SessionAwareJWTAuthentication had no
    OpenApiAuthenticationExtension, so drf-spectacular resolved no
    scheme and emitted no security requirement anywhere. The schema
    claimed the whole API was public and generated clients never sent
    the Authorization header.
    """

    import yaml

    body = api_client.get(reverse("schema")).content.decode()
    document = yaml.safe_load(body)

    assert "jwtAuth" in document["components"]["securitySchemes"]

    protected = document["paths"]["/api/v1/auth/me/"]["get"]

    assert {"jwtAuth": []} in protected["security"]


def test_public_endpoints_do_not_require_authentication(api_client):
    """
    A hand-written scheme was applied globally, so login and register
    advertised an auth requirement they do not have.
    """

    import yaml

    body = api_client.get(reverse("schema")).content.decode()
    document = yaml.safe_load(body)

    for path in (
        "/api/v1/auth/login/",
        "/api/v1/auth/register/",
        "/api/v1/auth/mfa/verify/",
    ):
        security = document["paths"][path]["post"].get("security")

        assert security == [{}], f"{path} advertises {security}"


def test_no_view_is_dropped_from_the_schema(api_client):
    """
    drf-spectacular silently omits any view it cannot get a serializer
    from, so an endpoint can vanish from the docs while still working.
    """

    import yaml
    from django.urls import get_resolver

    body = api_client.get(reverse("schema")).content.decode()
    documented = set(yaml.safe_load(body)["paths"])

    routed = set()

    def walk(resolver, prefix=""):
        for entry in resolver.url_patterns:
            if hasattr(entry, "url_patterns"):
                walk(entry, prefix + str(entry.pattern))
            else:
                route = prefix + str(entry.pattern)
                if route.startswith("api/v1/"):
                    routed.add("/" + route)

    walk(get_resolver())

    # Normalise Django's <uuid:name> against OpenAPI's {name}.
    import re

    normalised = {re.sub(r"<[^:>]+:([^>]+)>", r"{\1}", route) for route in routed}

    missing = normalised - documented

    assert not missing, f"routed but undocumented: {sorted(missing)}"
