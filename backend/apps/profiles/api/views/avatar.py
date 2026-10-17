"""
API endpoint for managing the authenticated user's avatar.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.profiles.api.serializers.profile.avatar import (
    AvatarUploadSerializer,
)
from apps.profiles.api.serializers.profile.detail import (
    ProfileSerializer,
)
from apps.profiles.selectors.profile import get_profile_by_user
from apps.profiles.services.account.delete_avatar import (
    delete_avatar,
)
from apps.profiles.services.account.update_avatar import (
    update_avatar,
)
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    unauthorized_schema,
)


class AvatarAPIView(AuthenticatedAPIView):
    """
    Upload, replace or delete the authenticated user's avatar.
    """

    serializer_class = AvatarUploadSerializer

    @extend_schema(
        tags=["Profile"],
        summary="Update avatar",
        description="Upload or replace the authenticated user's avatar.",
        request=AvatarUploadSerializer,
        responses={
            200: success_schema(
                description="Avatar updated successfully.",
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

        serializer = self.get_serializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        update_avatar(
            user=request.user,
            avatar=serializer.validated_data["avatar"],
        )

        profile = get_profile_by_user(user_id=request.user.id)

        return SuccessResponse.ok(
            message="Avatar updated successfully.",
            data=ProfileSerializer(profile).data,
        )

    @extend_schema(
        tags=["Profile"],
        summary="Delete avatar",
        description="Delete the authenticated user's avatar.",
        responses={
            200: success_schema(
                description="Avatar deleted successfully.",
                response=ProfileSerializer,
            ),
            401: unauthorized_schema(),
        },
    )
    def delete(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:

        delete_avatar(user=request.user)

        profile = get_profile_by_user(user_id=request.user.id)

        return SuccessResponse.ok(
            message="Avatar deleted successfully.",
            data=ProfileSerializer(profile).data,
        )
