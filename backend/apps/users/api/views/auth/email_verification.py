"""
Email verification API endpoint.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.email_verification import (
    EmailVerificationSerializer,
)
from apps.users.services.auth.email_verification import verify_email
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import EmailVerificationThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Verify email address",
    description=("Verify a user's email address using the verification token."),
    request=EmailVerificationSerializer,
    responses={
        200: success_schema(
            description="Email verified successfully.",
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
)
class EmailVerificationAPIView(PublicAPIView):
    """
    Verify a user's email.
    """

    serializer_class = EmailVerificationSerializer

    # Throttled because the endpoint consumes a secret: without a limit
    # it accepts unlimited verification token guesses.
    throttle_classes = (EmailVerificationThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        verify_email(
            raw_token=serializer.validated_data["token"],
            request=request,
        )

        return SuccessResponse.ok(
            message="Email address verified successfully.",
        )
