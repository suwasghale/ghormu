"""
API endpoint for setting the default address.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.profiles.api.serializers.address.detail import (
    AddressSerializer,
)
from apps.profiles.api.views.address.base import AddressAPIView
from apps.profiles.services.address.set_default import (
    set_default_address,
)
from core.api.responses import SuccessResponse
from core.api.schemas import (
    not_found_schema,
    success_schema,
    unauthorized_schema,
)


class AddressSetDefaultAPIView(AddressAPIView):
    """
    Set one of the authenticated user's addresses as default.
    """

    # The request body is empty, but drf-spectacular drops any view it
    # cannot get a serializer from - so the endpoint would be missing
    # from the schema entirely rather than merely undocumented.
    serializer_class = AddressSerializer

    @extend_schema(
        tags=["Address"],
        summary="Set default address",
        description=(
            "Set one of the authenticated user's addresses as the default address."
        ),
        responses={
            200: success_schema(
                description="Default address updated successfully.",
                response=AddressSerializer,
            ),
            401: unauthorized_schema(),
            404: not_found_schema(),
        },
    )
    def post(
        self,
        request: Request,
        address_id,
        *args,
        **kwargs,
    ) -> Response:

        address = self.get_address(address_id)

        address = set_default_address(
            user=request.user,
            address=address,
        )

        serializer = AddressSerializer(
            address,
        )

        return SuccessResponse.ok(
            message="Default address updated successfully.",
            data=serializer.data,
        )
