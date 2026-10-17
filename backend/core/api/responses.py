"""
Reusable API response helpers.

Every successful API response in the project should be
generated through these helpers to keep a consistent
response structure.

Response format:
SUCCESSFUL RESPONSE:
{
    "success": true,
    "message": "...",
    "data": {...}
}

ERROR RESPONSE:
{
    "success": false,
    "message": "Invalid token.",
    "errors": {
        "token": [
            "Token has expired."
        ]
    }
}

"""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.response import Response


class SuccessResponse:
    @staticmethod
    def _build(
        *,
        message: str,
        data: Any = None,
        status_code: int,
        headers: dict[str, str] | None = None,
    ) -> Response:
        return Response(
            {
                "success": True,
                "message": message,
                "data": data,
            },
            status=status_code,
            headers=headers,
        )

    @classmethod
    def ok(cls, *, message="Success.", data=None):
        return cls._build(
            message=message,
            data=data,
            status_code=status.HTTP_200_OK,
        )

    @classmethod
    def created(cls, *, message="Resource created.", data=None, headers=None):
        return cls._build(
            message=message,
            data=data,
            status_code=status.HTTP_201_CREATED,
            headers=headers,
        )

    @classmethod
    def accepted(cls, *, message="Request accepted.", data=None):
        return cls._build(
            message=message,
            data=data,
            status_code=status.HTTP_202_ACCEPTED,
        )

    @staticmethod
    def no_content():
        return Response(status=status.HTTP_204_NO_CONTENT)
