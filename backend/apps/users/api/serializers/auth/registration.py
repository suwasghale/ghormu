"""
Serializers for user registration.

Responsibilities:

- Validate incoming registration data.
- Normalize user input.
- Ensure email uniqueness.
- Validate passwords.

Serializers NEVER create users.
Business logic belongs to the service layer.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.api.serializers.base import (
    EmailSerializer,
)
from apps.users.selectors.user import (
    exists_user_by_email,
)

# =============================================================================
# Registration
# =============================================================================


class RegistrationSerializer(
    EmailSerializer,
):
    """
    User registration serializer.
    """

    first_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )

    last_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )

    password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    def validate_first_name(
        self,
        value: str,
    ) -> str:
        """
        Normalize first name.
        """
        return self.normalize_string(value)

    def validate_last_name(
        self,
        value: str,
    ) -> str:
        """
        Normalize last name.
        """
        return self.normalize_string(value)

    def validate_email(
        self,
        value: str,
    ) -> str:
        """
        Normalize email and ensure uniqueness.
        """
        value = super().validate_email(value)

        if exists_user_by_email(email=value):
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(
        self,
        attrs: dict[str, object],
    ) -> dict[str, object]:
        """
        Validate passwords.
        """
        password = str(attrs["password"])
        password_confirm = str(attrs["password_confirm"])

        if password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": ("Passwords do not match.")}
            )

        from django.contrib.auth.password_validation import (
            validate_password,
        )

        validate_password(password)

        attrs["password"] = password

        return attrs
