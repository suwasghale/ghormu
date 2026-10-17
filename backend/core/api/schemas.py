"""
Reusable OpenAPI schema helpers.

This module centralizes reusable drf-spectacular
schema definitions.

Views should import these helpers instead of
duplicating OpenApiResponse definitions.
"""

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
)
from rest_framework.serializers import Serializer


def success_schema(
    *,
    description: str = "Success.",
    response: type[Serializer] | None = None,
    examples: list[OpenApiExample] | None = None,
) -> OpenApiResponse:

    return OpenApiResponse(
        response=response,
        description=description,
        examples=examples,
    )


def created_schema(
    *,
    description: str = "Resource created successfully.",
    response: type[Serializer] | None = None,
    examples: list[OpenApiExample] | None = None,
) -> OpenApiResponse:
    return OpenApiResponse(
        response=response,
        description=description,
        examples=examples,
    )


def accepted_schema(
    *,
    description: str = "Request accepted.",
    response: type[Serializer] | None = None,
    examples: list[OpenApiExample] | None = None,
) -> OpenApiResponse:
    return OpenApiResponse(
        response=response,
        description=description,
    )


def no_content_schema() -> OpenApiResponse:
    return OpenApiResponse(
        response=None,
        description="No content.",
    )


def bad_request_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Validation error.",
    )


def unauthorized_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Authentication required.",
    )


def forbidden_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Permission denied.",
    )


def not_found_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Requested resource was not found.",
    )


def conflict_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Conflict.",
    )


def too_many_requests_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Too many requests.",
    )


def server_error_schema() -> OpenApiResponse:
    return OpenApiResponse(
        description="Internal server error.",
    )
