"""
API endpoint for logging out from all devices.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.logout_all import (
    LogoutAllSerializer,
)
from apps.users.services.auth.logout_all import (
    logout_all,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    success_schema,
    unauthorized_schema,
)


@extend_schema(
    tags=["Authentication"],
    summary="Logout from all devices",
    description=(
        "Blacklist every outstanding refresh token belonging to the authenticated user."
    ),
    request=LogoutAllSerializer,
    responses={
        200: success_schema(
            description="Logged out from all devices.",
        ),
        401: unauthorized_schema(),
    },
)
class LogoutAllAPIView(BaseAPIView):
    """
    Logout the authenticated user from every device.
    """

    serializer_class = LogoutAllSerializer

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        logout_all(
            user=request.user,
        )

        return SuccessResponse.ok(
            message="Logged out from all devices.",
        )
