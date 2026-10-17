"""
API endpoint for user login.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.login import (
    LoginSerializer,
)
from apps.users.api.serializers.auth.login_response import (
    LoginResponseSerializer,
)
from apps.users.services.auth.login import (
    login as login_user,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import LoginThrottle


@extend_schema(
    tags=["Authentication"],
    summary="User login",
    description="Authenticate a user using email and password.",
    request=LoginSerializer,
    responses={
        200: success_schema(
            description="Login successful.",
            response=LoginResponseSerializer,
        ),
        400: bad_request_schema(),
        429: too_many_requests_schema(),
    },
)
class LoginAPIView(BaseAPIView):
    """
    Authenticate a user.
    """

    authentication_classes = ()

    permission_classes = (AllowAny,)

    throttle_classes = (LoginThrottle,)

    serializer_class = LoginSerializer

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

        result = login_user(
            request=request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        response_data = LoginResponseSerializer(
            result,
        ).data

        return SuccessResponse.ok(
            message="Login successful.",
            data=response_data,
        )
