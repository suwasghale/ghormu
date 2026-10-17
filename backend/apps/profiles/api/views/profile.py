"""
API endpoint for the authenticated user's profile.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.profiles.api.serializers.profile.detail import (
    ProfileSerializer,
)
from apps.profiles.api.serializers.profile.update import (
    UpdateProfileSerializer,
)
from apps.profiles.selectors.profile import get_profile_by_user
from apps.profiles.services.account.update_profile import (
    update_profile,
)
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    unauthorized_schema,
)


class ProfileAPIView(AuthenticatedAPIView):
    """
    Retrieve and update the authenticated user's profile.
    """

    serializer_class = ProfileSerializer

    # =========================================================================
    # GET
    # =========================================================================

    @extend_schema(
        tags=["Profile"],
        summary="Current user's profile",
        responses={
            200: success_schema(
                description="Profile retrieved successfully.",
                response=ProfileSerializer,
            ),
            401: unauthorized_schema(),
        },
    )
    def get(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:
        profile = get_profile_by_user(user_id=request.user.id)

        return SuccessResponse.ok(
            message="Profile retrieved successfully.",
            data=ProfileSerializer(profile).data,
        )

    # =========================================================================
    # PATCH
    # =========================================================================

    @extend_schema(
        tags=["Profile"],
        summary="Update the current user's profile",
        description=(
            "Partially update the authenticated user's name and profile fields."
        ),
        request=UpdateProfileSerializer,
        responses={
            200: success_schema(
                description="Profile updated successfully.",
                response=ProfileSerializer,
            ),
            400: bad_request_schema(),
            401: unauthorized_schema(),
        },
    )
    def patch(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:
        serializer = UpdateProfileSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        profile = update_profile(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        return SuccessResponse.ok(
            message="Profile updated successfully.",
            data=ProfileSerializer(profile).data,
        )
