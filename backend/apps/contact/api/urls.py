"""
Routes for the contact form and the staff inbox.
"""

from django.urls import path

from apps.contact.api import views

public_urlpatterns = [
    path("", views.ContactSubmitAPIView.as_view(), name="contact-submit"),
]

admin_urlpatterns = [
    path("", views.ContactMessageAdminListAPIView.as_view(), name="admin-message-list"),
    path(
        "<uuid:id>/",
        views.ContactMessageAdminDetailAPIView.as_view(),
        name="admin-message-detail",
    ),
]
