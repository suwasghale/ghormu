"""
URLconf without the profiles app.

Companion to config/settings/_no_profiles.py.
"""

from django.urls import include, path

urlpatterns = [
    path(
        "api/v1/",
        include(
            ("apps.users.api.urls", "api"),
            namespace="v1",
        ),
    ),
]
