"""
Shared behaviour for address endpoints.
"""

from __future__ import annotations

from uuid import UUID

from apps.profiles.models import Address
from apps.profiles.selectors.address import find_user_address
from core.api.base import AuthenticatedAPIView
from core.exceptions import NotFound


class AddressAPIView(AuthenticatedAPIView):
    """
    Base view for endpoints operating on a single address.
    """

    def get_address(
        self,
        address_id: UUID,
    ) -> Address:
        """
        Return the caller's address, or raise 404.

        Scoped to the requesting user so that an address belonging to
        somebody else is indistinguishable from one that does not
        exist. Answering 403 for the former would confirm the id is
        real.
        """

        address = find_user_address(
            user_id=self.request.user.id,
            address_id=address_id,
        )

        if address is None:
            raise NotFound("Address not found.")

        return address
