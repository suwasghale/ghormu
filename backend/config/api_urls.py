"""Reusable identity, account and administration API."""

from django.urls import include, path

from core.api.admin_media import AdminMediaUploadAPIView

urlpatterns = [
    path("admin/dashboard/", include("apps.dashboard.api.urls")),
    path("", include("apps.users.api.urls")),
    path("me/", include("apps.profiles.api.urls")),
    path("admin/users/", include("apps.users.api.admin.urls")),
    path("admin/media/", AdminMediaUploadAPIView.as_view(), name="admin-media-upload"),
]
