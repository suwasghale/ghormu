"""
API endpoints for trusted devices.
"""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.security.trusted_devices import (
    TrustedDeviceSerializer,
)
from apps.users.selectors.security.session import (
    get_user_session_by_id,
)
from apps.users.selectors.security.trusted_devices import (
    list_trusted_devices,
)
from apps.users.services.security.trust_device import (
    trust_device,
)
from apps.users.services.security.untrust_device import (
    untrust_device,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    not_found_schema,
    success_schema,
    unauthorized_schema,
)
from core.exceptions import NotFound

# ====================================================
# List trusted devices
# ====================================================


class TrustedDeviceListAPIView(BaseAPIView):
    """
    List trusted devices.
    """

    # Empty request body, but drf-spectacular drops any view it cannot
    # get a serializer from, so the endpoint would vanish from the
    # schema rather than merely be undocumented.
    serializer_class = TrustedDeviceSerializer

    @extend_schema(
        tags=["Security"],
        summary="List trusted devices",
        responses={
            200: success_schema(
                description="Trusted devices retrieved successfully.",
                response=TrustedDeviceSerializer(many=True),
            ),
            401: unauthorized_schema(),
        },
    )
    def get(
        self,
        request: Request,
    ) -> Response:

        devices = list_trusted_devices(
            user=request.user,
        )

        serializer = TrustedDeviceSerializer(
            devices,
            many=True,
        )

        return SuccessResponse.ok(
            message="Trusted devices retrieved successfully.",
            data=serializer.data,
        )


# ====================================================
# Trust a device
# ====================================================


class TrustDeviceAPIView(BaseAPIView):
    """
    Trust a device.
    """

    # Empty request body, but drf-spectacular drops any view it cannot
    # get a serializer from, so the endpoint would vanish from the
    # schema rather than merely be undocumented.
    serializer_class = TrustedDeviceSerializer

    @extend_schema(
        tags=["Security"],
        summary="Trust device",
        responses={
            200: success_schema(
                description="Device trusted successfully.",
                response=TrustedDeviceSerializer,
            ),
            401: unauthorized_schema(),
            404: not_found_schema(),
        },
    )
    def post(
        self,
        request: Request,
        session_id: UUID,
    ) -> Response:

        session = get_user_session_by_id(
            user=request.user,
            session_id=session_id,
        )

        if session is None:
            raise NotFound(
                "Session not found.",
            )

        session = trust_device(
            user=request.user,
            session=session,
        )

        serializer = TrustedDeviceSerializer(
            session,
        )

        return SuccessResponse.ok(
            message="Device trusted successfully.",
            data=serializer.data,
        )


# ====================================================
# Untrust a device
# ====================================================


class UntrustDeviceAPIView(BaseAPIView):
    """
    Remove trust from a device.
    """

    # Empty request body, but drf-spectacular drops any view it cannot
    # get a serializer from, so the endpoint would vanish from the
    # schema rather than merely be undocumented.
    serializer_class = TrustedDeviceSerializer

    @extend_schema(
        tags=["Security"],
        summary="Untrust device",
        responses={
            200: success_schema(
                description="Device removed from trusted devices.",
                response=TrustedDeviceSerializer,
            ),
            401: unauthorized_schema(),
            404: not_found_schema(),
        },
    )
    def delete(
        self,
        request: Request,
        session_id: UUID,
    ) -> Response:

        session = get_user_session_by_id(
            user=request.user,
            session_id=session_id,
        )

        if session is None:
            raise NotFound(
                "Session not found.",
            )

        session = untrust_device(
            user=request.user,
            session=session,
        )

        serializer = TrustedDeviceSerializer(
            session,
        )

        return SuccessResponse.ok(
            message="Device removed from trusted devices.",
            data=serializer.data,
        )
