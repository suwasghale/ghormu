"""
Address-related business exceptions.
"""

from __future__ import annotations

from rest_framework.exceptions import ValidationError


class DuplicateAddressType(ValidationError):
    """
    Raised when a user already owns an address of the requested type.
    """

    default_detail = "You already have an address with this type."

    default_code = "duplicate_address_type"

    def __init__(
        self,
        address_type: str,
    ):
        super().__init__(
            detail={
                "address_type": [
                    (f"You already have a {address_type} address. Update it instead.")
                ]
            }
        )
