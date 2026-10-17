"""
Serializer for updating the authenticated user's profile.
"""

from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from apps.users.choices import GenderChoices

# Upper bound on a plausible birth year, used to reject typos such as
# 0202 that would otherwise be stored happily.
MAX_PLAUSIBLE_AGE = 130


class UpdateProfileSerializer(serializers.Serializer):
    """
    Partial update of the authenticated user's account.
    """

    # ------------------------------------------------------------------
    # User fields
    # ------------------------------------------------------------------

    first_name = serializers.CharField(
        required=False,
        max_length=150,
    )

    last_name = serializers.CharField(
        required=False,
        max_length=150,
    )

    # ------------------------------------------------------------------
    # Profile fields
    # ------------------------------------------------------------------

    gender = serializers.ChoiceField(
        required=False,
        choices=GenderChoices.choices,
    )

    date_of_birth = serializers.DateField(
        required=False,
    )

    nationality = serializers.CharField(
        required=False,
        max_length=2,
    )

    phone_number = serializers.CharField(
        required=False,
        max_length=32,
    )

    biography = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    preferred_language = serializers.CharField(
        required=False,
        max_length=10,
    )

    timezone = serializers.CharField(
        required=False,
        max_length=100,
    )

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate_date_of_birth(self, value):
        """
        Reject dates that cannot describe a living person.

        This rule previously lived only in `Profile.clean()`, which ran
        via `full_clean()` on every save. With that removed from the
        write path, the check belongs here - where a bad value produces
        a field-level 400 rather than a Django ValidationError raised
        from inside the service layer.
        """

        today = timezone.now().date()

        if value > today:
            raise serializers.ValidationError(
                "Date of birth cannot be in the future.",
            )

        if value.year < today.year - MAX_PLAUSIBLE_AGE:
            raise serializers.ValidationError(
                "Date of birth is not a plausible date.",
            )

        return value

    def validate_first_name(self, value: str) -> str:
        return value.strip()

    def validate_last_name(self, value: str) -> str:
        return value.strip()

    def validate(self, attrs):
        """
        Ensure at least one field is supplied.
        """

        if not attrs:
            raise serializers.ValidationError("At least one field must be provided.")

        return attrs
