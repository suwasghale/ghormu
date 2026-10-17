"""
API endpoint for the authenticated user's identity.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth import CurrentUserSerializer
from apps.users.selectors.user import get_user_by_id
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import success_schema, unauthorized_schema


@extend_schema(
    tags=["Authentication"],
    summary="Current authenticated user",
    description=(
        "Identity and account status for the signed-in user. Profile "
        "details are served separately at /me/profile/."
    ),
    responses={
        200: success_schema(
            description="Current user retrieved successfully.",
            response=CurrentUserSerializer,
        ),
        401: unauthorized_schema(),
    },
)
class MeAPIView(AuthenticatedAPIView):
    """
    Retrieve the authenticated user.
    """

    serializer_class = CurrentUserSerializer

    def get(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:
        user = get_user_by_id(user_id=request.user.id)

        return SuccessResponse.ok(
            message="Current user retrieved successfully.",
            data=self.get_serializer(user).data,
        )
