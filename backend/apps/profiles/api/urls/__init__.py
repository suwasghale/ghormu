"""
Profile API endpoints.
"""

from __future__ import annotations

from django.urls import include, path

from apps.profiles.api.views.avatar import AvatarAPIView
from apps.profiles.api.views.profile import ProfileAPIView

app_name = "profiles"

urlpatterns = [
    path(
        "profile/",
        ProfileAPIView.as_view(),
        name="profile",
    ),
    path(
        "profile/avatar/",
        AvatarAPIView.as_view(),
        name="profile-avatar",
    ),
    path(
        "addresses/",
        include("apps.profiles.api.urls.address"),
    ),
]
