from __future__ import annotations

from rest_framework import serializers

from apps.users.models import UserSession


class SessionSerializer(serializers.ModelSerializer):
    """
    Serialize an active user session.
    """

    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession

        fields = (
            "id",
            "device_name",
            "device_type",
            "browser",
            "browser_version",
            "operating_system",
            "operating_system_version",
            "country",
            "city",
            "ip_address",
            "login_at",
            "last_activity",
            "is_trusted",
            "is_current",
        )

    def get_is_current(self, obj: UserSession) -> bool:
        current_session_id = self.context.get(
            "current_session_id",
        )

        return str(obj.id) == str(current_session_id)
