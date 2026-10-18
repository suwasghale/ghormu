"""
Contact form endpoint and the staff inbox.

    POST             /api/v1/contact/
    GET              /api/v1/admin/messages/
    GET|PATCH|DELETE /api/v1/admin/messages/<id>/
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response

from apps.contact.api.serializers import (
    ContactMessageAdminSerializer,
    ContactSubmissionSerializer,
)
from apps.contact.models import ContactMessage
from apps.contact.services import submit_message
from core.api.admin import AdminDetailAPIView, AdminListCreateAPIView
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.throttles import SubmissionThrottle

ACCEPTED = "Thank you. Your message has been received."


class ContactSubmitAPIView(PublicAPIView):
    serializer_class = ContactSubmissionSerializer
    throttle_classes = (SubmissionThrottle,)

    @extend_schema(responses={201: None})
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = dict(serializer.validated_data)

        # A filled honeypot gets the same answer as a real message, so a bot
        # learns nothing; it is simply not stored or forwarded.
        if data.pop("website", ""):
            return SuccessResponse.created(message=ACCEPTED)

        submit_message(**data)

        return SuccessResponse.created(message=ACCEPTED)


class _MessageConfig:
    model = ContactMessage
    serializer_class = ContactMessageAdminSerializer
    search_fields = ("name", "email", "phone", "message")
    filter_fields = ("topic", "handled")
    ordering_fields = ("created_at",)
    default_ordering = ("-created_at",)
    # Messages are private; nothing on the site changes.
    revalidate_tag = ""


class ContactMessageAdminListAPIView(_MessageConfig, AdminListCreateAPIView):
    """The inbox. Messages arrive through the website form only."""

    def post(self, request, *args, **kwargs):
        return Response(
            {
                "success": False,
                "message": "Messages arrive through the contact form.",
                "errors": {},
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ContactMessageAdminDetailAPIView(_MessageConfig, AdminDetailAPIView):
    """One message."""
