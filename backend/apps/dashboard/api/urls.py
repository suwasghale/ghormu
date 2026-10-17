"""
Admin dashboard route.
"""

from django.urls import path

from apps.dashboard.api.views import AdminDashboardAPIView

app_name = "dashboard-admin"

urlpatterns = [
    path("", AdminDashboardAPIView.as_view(), name="dashboard"),
]
