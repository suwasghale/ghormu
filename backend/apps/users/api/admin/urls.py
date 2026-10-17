"""
Admin routes for user accounts.
"""

from django.urls import path

from apps.users.api.admin.views import (
    UserAdminDetailAPIView,
    UserAdminListAPIView,
)

app_name = "users-admin"

urlpatterns = [
    path("", UserAdminListAPIView.as_view(), name="list"),
    path("<uuid:id>/", UserAdminDetailAPIView.as_view(), name="detail"),
]
