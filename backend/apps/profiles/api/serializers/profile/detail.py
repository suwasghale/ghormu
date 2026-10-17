"""
Serializer for user profile information.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.profiles.models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    timezone = serializers.SerializerMethodField()

    class Meta:
        model = Profile

        fields = (
            "gender",
            "date_of_birth",
            "nationality",
            "phone_number",
            "biography",
            "preferred_language",
            "timezone",
            "avatar",
        )

    def get_timezone(
        self,
        obj: Profile,
    ) -> str | None:
        if obj.timezone is None:
            return None

        return str(obj.timezone)
