"""
API endpoint for requesting a password reset.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.forgot_password import (
    ForgotPasswordSerializer,
)
from apps.users.services.auth.forgot_password import (
    forgot_password,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import PasswordResetThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Forgot password",
    description=(
        "Request a password reset email. "
        "For security reasons, this endpoint always returns the same "
        "response regardless of whether the email exists."
    ),
    request=ForgotPasswordSerializer,
    responses={
        200: success_schema(
            description="Password reset request accepted.",
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
)
class ForgotPasswordAPIView(BaseAPIView):
    """
    Request a password reset.
    """

    authentication_classes = ()

    permission_classes = (AllowAny,)

    throttle_classes = (PasswordResetThrottle,)

    serializer_class = ForgotPasswordSerializer

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

        forgot_password(
            email=serializer.validated_data["email"],
            created_ip=self.get_client_ip(),
            user_agent=self.get_user_agent(),
            request=request,
        )

        return SuccessResponse.ok(
            message=(
                "If an account exists for this email address, "
                "a password reset link has been sent."
            ),
        )
