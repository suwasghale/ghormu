"""
API endpoint for changing the authenticated user's password.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.change_password import (
    ChangePasswordSerializer,
)
from apps.users.api.serializers.auth.login_response import (
    LoginTokensSerializer,
)
from apps.users.services.auth.change_password import change_password
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
    unauthorized_schema,
)
from core.api.throttles import PasswordChangeThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Change password",
    description=(
        "Change the password of the currently authenticated user. "
        "Every existing session is revoked, including the caller's, so "
        "a replacement token pair is returned. Clients must store it "
        "and discard the previous one."
    ),
    request=ChangePasswordSerializer,
    responses={
        200: success_schema(
            description="Password changed successfully.",
            response=LoginTokensSerializer,
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class ChangePasswordAPIView(AuthenticatedAPIView):
    """
    Change the authenticated user's password.
    """

    serializer_class = ChangePasswordSerializer

    throttle_classes = (PasswordChangeThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        issued = change_password(
            user=request.user,
            current_password=serializer.validated_data["current_password"],
            new_password=serializer.validated_data["new_password"],
            request=request,
        )

        return SuccessResponse.ok(
            message="Password changed successfully.",
            data={
                "tokens": LoginTokensSerializer(
                    {
                        "access": issued.tokens.access,
                        "refresh": issued.tokens.refresh,
                    },
                ).data,
            },
        )
