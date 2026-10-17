"""
API endpoints for updating and deleting a user address.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.profiles.api.serializers.address.detail import (
    AddressSerializer,
)
from apps.profiles.api.serializers.address.update import (
    AddressUpdateSerializer,
)
from apps.profiles.api.views.address.base import AddressAPIView
from apps.profiles.services.address.delete import (
    delete_address,
)
from apps.profiles.services.address.update import (
    update_address,
)
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    not_found_schema,
    success_schema,
    unauthorized_schema,
)


class AddressDetailAPIView(AddressAPIView):
    """
    Update or delete one of the authenticated user's addresses.
    """

    # -------------------------------------------------------------------------
    # PATCH
    # -------------------------------------------------------------------------

    @extend_schema(
        tags=["Address"],
        summary="Update address",
        description="Update one of the authenticated user's addresses.",
        request=AddressUpdateSerializer,
        responses={
            200: success_schema(
                description="Address updated successfully.",
                response=AddressSerializer,
            ),
            400: bad_request_schema(),
            401: unauthorized_schema(),
            404: not_found_schema(),
        },
    )
    def patch(
        self,
        request: Request,
        address_id,
        *args,
        **kwargs,
    ) -> Response:

        address = self.get_address(address_id)

        serializer = AddressUpdateSerializer(
            address,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        address = update_address(
            user=request.user,
            address=address,
            **serializer.validated_data,
        )

        response_serializer = AddressSerializer(
            address,
        )

        return SuccessResponse.ok(
            message="Address updated successfully.",
            data=response_serializer.data,
        )

    # -------------------------------------------------------------------------
    # DELETE
    # -------------------------------------------------------------------------

    @extend_schema(
        tags=["Address"],
        summary="Delete address",
        description="Delete one of the authenticated user's addresses.",
        responses={
            200: success_schema(
                description="Address deleted successfully.",
            ),
            401: unauthorized_schema(),
            404: not_found_schema(),
        },
    )
    def delete(
        self,
        request: Request,
        address_id,
        *args,
        **kwargs,
    ) -> Response:

        address = self.get_address(address_id)

        delete_address(
            user=request.user,
            address=address,
        )

        return SuccessResponse.ok(
            message="Address deleted successfully.",
        )
