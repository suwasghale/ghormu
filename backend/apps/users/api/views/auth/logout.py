"""
API endpoint for logging out of the current session.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.logout import LogoutSerializer
from apps.users.services.auth.logout import logout
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    unauthorized_schema,
)


@extend_schema(
    tags=["Authentication"],
    summary="Logout",
    description=(
        "Blacklist the supplied refresh token and close its session. "
        "The access token derived from it stops working immediately."
    ),
    request=LogoutSerializer,
    responses={
        200: success_schema(description="Logout successful."),
        400: bad_request_schema(),
        401: unauthorized_schema(),
    },
)
class LogoutAPIView(AuthenticatedAPIView):
    """
    Log the current session out.
    """

    serializer_class = LogoutSerializer

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        # The service takes `refresh_token`; this view previously passed
        # `refresh`, which raised TypeError on every call.
        #
        # `user` is passed so the service can verify the token belongs to
        # the caller. Without that check, any holder of a valid refresh
        # token could terminate another account's session.
        logout(
            refresh_token=serializer.validated_data["refresh"],
            user=request.user,
        )

        return SuccessResponse.ok(
            message="Logout successful.",
        )
