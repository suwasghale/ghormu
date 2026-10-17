"""
Global DRF exception handler.

Every exception raised by the application is converted into a
standardized JSON response:

{
    "success": false,
    "message": "...",
    "errors": {...}
}

Application exceptions also carry their stable ``code``. Clients need it
to tell a rejected credential (``invalid_otp``) from an expired access
token, which arrives from DRF's authentication layer without one; both
are 401s, and only the second is worth a token refresh.
"""

from __future__ import annotations

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import (
    PermissionDenied as DjangoPermissionDenied,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

from core.exceptions import AppException

logger = logging.getLogger("django.request")


def _envelope(
    *,
    message: str,
    errors,
    status_code: int,
    headers: dict | None = None,
    code: str | None = None,
) -> Response:
    body = {
        "success": False,
        "message": message,
        "errors": errors,
    }

    if code is not None:
        body["code"] = code

    return Response(
        body,
        status=status_code,
        headers=headers,
    )


def custom_exception_handler(exc, context):
    """
    Convert any exception into the project's error envelope.
    """

    # --------------------------------------------------------------------------
    # Translate Django exceptions into their DRF equivalents so they get
    # the correct status code instead of falling through to a 500.
    # --------------------------------------------------------------------------

    if isinstance(exc, Http404):
        exc = NotFound()

    elif isinstance(exc, ObjectDoesNotExist):
        # A selector called .get() on a row that is not there. Returning
        # 404 is almost always what the caller should see, and is far
        # better than the 500 this used to produce.
        #
        # Logged as a warning because it can also mean a genuine bug -
        # a lookup that should never miss - and that should stay
        # visible rather than being silently reshaped into a 404.
        logger.warning(
            "Unhandled %s surfaced to the API layer; returning 404.",
            type(exc).__name__,
            exc_info=exc,
        )

        exc = NotFound()

    elif isinstance(exc, DjangoPermissionDenied):
        exc = PermissionDenied()

    elif isinstance(exc, DjangoValidationError):
        exc = ValidationError(
            detail=getattr(
                exc,
                "message_dict",
                exc.messages,
            ),
        )

    # --------------------------------------------------------------------------
    # Application exceptions
    # --------------------------------------------------------------------------

    if isinstance(exc, AppException):
        return _envelope(
            message=exc.message,
            code=exc.code,
            errors=getattr(exc, "errors", None),
            status_code=getattr(
                exc,
                "status_code",
                status.HTTP_400_BAD_REQUEST,
            ),
            headers=getattr(exc, "headers", None),
        )

    # --------------------------------------------------------------------------
    # DRF exceptions
    # --------------------------------------------------------------------------

    response = exception_handler(exc, context)

    if response is not None:
        message = "Request failed."
        errors = None

        data = response.data

        if isinstance(data, dict):
            if "detail" in data:
                message = str(data["detail"])
            else:
                errors = data
                message = "Validation failed."
        else:
            errors = data

        if isinstance(exc, APIException):
            headers = {}

            auth_header = getattr(
                exc,
                "auth_header",
                None,
            )
            if auth_header:
                headers["WWW-Authenticate"] = auth_header

            wait = getattr(exc, "wait", None)
            if wait:
                headers["Retry-After"] = str(int(wait))

            for key, value in headers.items():
                response[key] = value

        response.data = {
            "success": False,
            "message": message,
            "errors": errors,
        }

        return response

    # --------------------------------------------------------------------------
    # Unexpected exceptions
    #
    # Previously this re-raised, which returned an HTML debug page or a
    # bare Django 500 and broke the JSON contract for every client. Log
    # the traceback server-side and return an opaque envelope instead:
    # exception text can carry query fragments, file paths and internal
    # identifiers that should never reach a caller.
    # --------------------------------------------------------------------------

    request = context.get("request") if context else None

    logger.exception(
        "Unhandled exception in %s",
        getattr(request, "path", "unknown path"),
        exc_info=exc,
        extra={"request": request},
    )

    return _envelope(
        message="An unexpected server error occurred.",
        errors=None,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
