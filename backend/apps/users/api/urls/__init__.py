"""
Users app API routes.
"""

from django.urls import include, path

urlpatterns = [
    path(
        "auth/",
        include("apps.users.api.urls.auth"),
    ),
]
