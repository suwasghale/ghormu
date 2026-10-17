"""
Views for deleting the authenticated user's account.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth import DeleteAccountSerializer
from apps.users.services.auth.delete_account import delete_account
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
    unauthorized_schema,
)
from core.api.throttles import AccountDeleteThrottle


@extend_schema(
    tags=["Account"],
    summary="Delete account",
    description=(
        "Soft delete the authenticated user's account. Requires the "
        "current password, plus a two-factor or recovery code when "
        "two-factor authentication is enabled, and revokes every "
        "session. Personal data is anonymized after the configured "
        "grace period."
    ),
    request=DeleteAccountSerializer,
    responses={
        200: success_schema(description="Account deleted."),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class DeleteAccountAPIView(AuthenticatedAPIView):
    """
    Deactivate the authenticated user's account.

    Security:
        - Authentication required.
        - Current password must be provided.
        - A second-factor code must be provided when MFA is enabled.
        - Revokes every session and refresh token.
        - Invalidates every outstanding one-time token.
    """

    serializer_class = DeleteAccountSerializer

    throttle_classes = (AccountDeleteThrottle,)

    def delete(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        delete_account(
            user=request.user,
            password=serializer.validated_data["password"],
            code=serializer.validated_data.get("code", ""),
            request=request,
        )

        return SuccessResponse.ok(
            message="Your account has been deleted successfully.",
        )
