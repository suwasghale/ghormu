"""
Views for changing a user's email address.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth import (
    ConfirmEmailChangeSerializer,
    RequestEmailChangeSerializer,
)
from apps.users.services.auth.change_email import (
    confirm_email_change,
    request_email_change,
)
from core.api.base import AuthenticatedAPIView, PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
    unauthorized_schema,
)
from core.api.throttles import EmailChangeThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Request email change",
    description=(
        "Send a confirmation link to a new email address. The address "
        "is not changed until the link is used."
    ),
    request=RequestEmailChangeSerializer,
    responses={
        200: success_schema(
            description="Verification email sent.",
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class RequestEmailChangeAPIView(AuthenticatedAPIView):
    """
    Request an email address change.
    """

    serializer_class = RequestEmailChangeSerializer

    throttle_classes = (EmailChangeThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        request_email_change(
            user=request.user,
            new_email=serializer.validated_data["new_email"],
            created_ip=self.get_client_ip(),
            user_agent=self.get_user_agent(),
        )

        return SuccessResponse.ok(
            message=("A verification email has been sent to your new email address."),
        )


@extend_schema(
    tags=["Authentication"],
    summary="Confirm email change",
    description=(
        "Confirm an email address change using the token from the confirmation link."
    ),
    request=ConfirmEmailChangeSerializer,
    responses={
        200: success_schema(
            description="Email address updated.",
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
)
class ConfirmEmailChangeAPIView(PublicAPIView):
    """
    Confirm an email address change.

    Reached through the link sent to the user's new address, so it must
    work without an access token.
    """

    serializer_class = ConfirmEmailChangeSerializer

    throttle_classes = (EmailChangeThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        confirm_email_change(
            raw_token=serializer.validated_data["token"],
            request=request,
        )

        return SuccessResponse.ok(
            message=("Your email address has been updated successfully."),
        )
