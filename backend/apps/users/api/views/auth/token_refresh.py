"""
API endpoint for rotating a refresh token.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.token_refresh import (
    TokenRefreshResponseSerializer,
    TokenRefreshSerializer,
)
from apps.users.services.auth.refresh import refresh_tokens
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    success_schema,
    too_many_requests_schema,
    unauthorized_schema,
)
from core.api.throttles import TokenRefreshThrottle


@extend_schema(
    tags=["Authentication"],
    summary="Refresh access token",
    description=(
        "Exchange a refresh token for a new token pair. The presented "
        "refresh token is blacklisted; presenting it again is treated "
        "as theft and revokes every session for the account."
    ),
    request=TokenRefreshSerializer,
    responses={
        200: success_schema(
            description="Access token refreshed.",
            response=TokenRefreshResponseSerializer,
        ),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class TokenRefreshAPIView(PublicAPIView):
    """
    Rotate a refresh token.
    """

    serializer_class = TokenRefreshSerializer

    throttle_classes = (TokenRefreshThrottle,)

    def post(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        result = refresh_tokens(
            refresh=serializer.validated_data["refresh"],
        )

        return SuccessResponse.ok(
            message="Access token refreshed.",
            data=TokenRefreshResponseSerializer(
                {
                    "access": result.tokens.access,
                    "refresh": result.tokens.refresh,
                },
            ).data,
        )
