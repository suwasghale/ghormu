"""
Root URL configuration.

Layout:

    /admin/                 Django admin
    /health/                Liveness and readiness probes
    /api/v1/                Versioned API
    /api/schema/            OpenAPI schema and browsable documentation
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.api.health import LivenessAPIView, ReadinessAPIView

urlpatterns = [
    path(
        "django-admin/",
        admin.site.urls,
    ),
    # -------------------------------------------------------------------------
    # Health
    # -------------------------------------------------------------------------
    path(
        "health/",
        LivenessAPIView.as_view(),
        name="health-live",
    ),
    path(
        "health/ready/",
        ReadinessAPIView.as_view(),
        name="health-ready",
    ),
    # -------------------------------------------------------------------------
    # API
    # -------------------------------------------------------------------------
    path(
        "api/v1/",
        include(
            (
                "config.api_urls",
                "api",
            ),
            namespace="v1",
        ),
    ),
]

# ------------------------------------------------------------------------------
# API documentation
#
# The raw schema is always available so clients can generate SDKs from it.
# The HTML explorers are opt-in: they are convenience UIs, not something a
# production deployment needs to expose by default.
# ------------------------------------------------------------------------------

urlpatterns += [
    path(
        "api/schema/",
        # `api_version` is required because the project uses
        # NamespaceVersioning. Without it drf-spectacular has no version
        # to filter on and emits `paths: {}` - a syntactically valid,
        # completely empty schema, which is worse than no schema at all
        # because tooling accepts it silently.
        SpectacularAPIView.as_view(api_version="v1"),
        name="schema",
    ),
]

# ------------------------------------------------------------------------------
# Uploaded media, in development only
#
# Nothing served /media/ locally. With cloud storage off, an upload landed
# in MEDIA_ROOT and its URL 404'd, so the admin's image fields could not be
# tested at all without a working R2 domain — and with cloud storage on but
# R2_CUSTOM_DOMAIN empty, MEDIA_URL also falls back to /media/ and hits the
# same dead end.
#
# `static()` returns an empty list unless DEBUG is on, so this cannot serve
# anything in production; there nginx handles it.
# ------------------------------------------------------------------------------

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.ENABLE_API_DOCS:
    urlpatterns += [
        path(
            "api/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path(
            "api/schema/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]
