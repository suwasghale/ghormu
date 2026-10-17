"""
Password validation helpers.
"""

from __future__ import annotations

from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from rest_framework import serializers


def validate_password_strength(
    value: str,
) -> str:
    """
    Validate a password using Django's configured
    AUTH_PASSWORD_VALIDATORS.
    """

    try:
        validate_password(value)

    except DjangoValidationError as exc:
        raise serializers.ValidationError(
            exc.messages,
        ) from exc

    return value
