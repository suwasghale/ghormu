"""
Base exceptions for the project.

Domain exceptions are plain Python exceptions rather than DRF
``APIException`` subclasses so that the service layer stays independent
of the HTTP layer. ``core.api.exceptions.custom_exception_handler``
translates them into responses.
"""

from __future__ import annotations

from typing import Any


class AppException(Exception):
    """
    Base exception for the project.

    Attributes:
        default_message:
            Human-readable message shown to the client.

        status_code:
            HTTP status used when this exception reaches the API layer.

        default_code:
            Stable, machine-readable identifier. Clients should branch on
            this rather than on the message, which is translated and may
            be reworded.
    """

    default_message = "An unexpected application error occurred."
    status_code = 400
    default_code = "error"

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        errors: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.errors = errors
        self.headers = headers

        super().__init__(self.message)
