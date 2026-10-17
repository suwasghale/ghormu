"""
Security API endpoints.
"""

from __future__ import annotations

from django.urls import path

from apps.users.api.views.security.revoke_session import (
    RevokeSessionAPIView,
)
from apps.users.api.views.security.sessions import (
    SessionListAPIView,
)
from apps.users.api.views.security.trusted_devices import (
    TrustDeviceAPIView,
    TrustedDeviceListAPIView,
    UntrustDeviceAPIView,
)

app_name = "security"

urlpatterns = [
    path(
        "sessions/",
        SessionListAPIView.as_view(),
        name="sessions",
    ),
    path(
        "sessions/<uuid:session_id>/",
        RevokeSessionAPIView.as_view(),
        name="session-revoke",
    ),
    # -------------------------------------------------------------------------
    # Trusted Devices
    # -------------------------------------------------------------------------
    path(
        "trusted-devices/",
        TrustedDeviceListAPIView.as_view(),
        name="trusted-devices",
    ),
    path(
        "trusted-devices/<uuid:session_id>/trust/",
        TrustDeviceAPIView.as_view(),
        name="trust-device",
    ),
    path(
        "trusted-devices/<uuid:session_id>/untrust/",
        UntrustDeviceAPIView.as_view(),
        name="untrust-device",
    ),
]
