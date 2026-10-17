"""
Reset password API.

Responsibilities:
    - Validate request data.
    - Call the password reset service.
    - Return an HTTP response.

No business logic belongs here.
"""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    extend_schema,
)
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.reset_password import (
    ResetPasswordSerializer,
)
from apps.users.services.auth.reset_password import reset_password
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import PasswordResetConfirmThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Reset password",
    description=(
        "Reset a user's password using a valid password reset token. "
        "Completing a reset revokes every existing session."
    ),
    request=ResetPasswordSerializer,
    responses={
        200: success_schema(
            description="Password successfully updated.",
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
    examples=[
        OpenApiExample(
            name="Reset password",
            value={
                "token": "2KFJ7EnClpU67a4uOYgERqjF1PwUlqcu3nrPUFVk_5w",
                "password": "MySecurePassword123!",
                "password_confirm": "MySecurePassword123!",
            },
            request_only=True,
        ),
    ],
)
class ResetPasswordAPIView(PublicAPIView):
    """
    Complete a password reset.
    """

    serializer_class = ResetPasswordSerializer

    # Consumes a secret, so it must be rate limited or it becomes an
    # unlimited reset-token guessing oracle.
    throttle_classes = (PasswordResetConfirmThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        reset_password(
            raw_token=serializer.validated_data["token"],
            new_password=serializer.validated_data["password"],
            request=request,
        )

        return SuccessResponse.ok(
            message="Password has been reset successfully.",
        )
