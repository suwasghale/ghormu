"""
API endpoint for resending an email verification link.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth import (
    ResendVerificationSerializer,
)
from apps.users.services.auth.email_verification import (
    resend_email_verification,
)
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import EmailVerificationResendThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Resend email verification",
    description=(
        "Request a fresh verification email. For security reasons this "
        "endpoint always returns the same response regardless of "
        "whether the address is registered or already verified."
    ),
    request=ResendVerificationSerializer,
    responses={
        200: success_schema(
            description="Verification email request accepted.",
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
)
class ResendVerificationAPIView(PublicAPIView):
    """
    Resend an email verification link.
    """

    serializer_class = ResendVerificationSerializer

    # Every call queues an outbound email to a caller-chosen address.
    # Unthrottled, this endpoint is a mail bomb.
    throttle_classes = (EmailVerificationResendThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        resend_email_verification(
            email=serializer.validated_data["email"],
            created_ip=self.get_client_ip(),
            user_agent=self.get_user_agent(),
        )

        return SuccessResponse.ok(
            message=(
                "If the account exists and is not yet verified, "
                "a verification email has been sent."
            ),
        )
