"""
API endpoints for listing and creating user addresses.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.profiles.api.serializers.address.create import (
    AddressCreateSerializer,
)
from apps.profiles.api.serializers.address.detail import (
    AddressSerializer,
)
from apps.profiles.selectors.address import (
    list_user_addresses,
)
from apps.profiles.services.address.create import (
    create_address,
)
from core.api.base import AuthenticatedAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    unauthorized_schema,
)


class AddressListCreateAPIView(AuthenticatedAPIView):
    """
    List and create addresses for the authenticated user.
    """

    serializer_class = AddressCreateSerializer
    # -------------------------------------------------------------------------
    # GET
    # -------------------------------------------------------------------------

    @extend_schema(
        tags=["Address"],
        summary="List user addresses",
        description="Retrieve all addresses belonging to the authenticated user.",
        responses={
            200: success_schema(
                description="Addresses retrieved successfully.",
                response=AddressSerializer(many=True),
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

        addresses = list_user_addresses(
            user_id=request.user.id,
        )

        serializer = AddressSerializer(
            addresses,
            many=True,
        )

        return SuccessResponse.ok(
            message="Addresses retrieved successfully.",
            data=serializer.data,
        )

    # -------------------------------------------------------------------------
    # POST
    # -------------------------------------------------------------------------

    @extend_schema(
        tags=["Address"],
        summary="Create address",
        description="Create a new address for the authenticated user.",
        request=AddressCreateSerializer,
        responses={
            201: success_schema(
                description="Address created successfully.",
                response=AddressSerializer,
            ),
            400: bad_request_schema(),
            401: unauthorized_schema(),
        },
    )
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

        address = create_address(
            user=request.user,
            **serializer.validated_data,
        )

        response_serializer = AddressSerializer(
            address,
        )

        return SuccessResponse.created(
            message="Address created successfully.",
            data=response_serializer.data,
        )
