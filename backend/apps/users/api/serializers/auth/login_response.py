"""
Serializer returned after successful authentication.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User


class LoginUserSerializer(serializers.ModelSerializer):
    """
    Public user information.
    """

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_verified",
            "is_staff",
            "is_superuser",
            "is_active",
        )

        read_only_fields = fields


class LoginTokensSerializer(serializers.Serializer):
    """
    JWT tokens.
    """

    access = serializers.CharField(read_only=True)

    refresh = serializers.CharField(read_only=True)


class LoginResponseSerializer(serializers.Serializer):
    """
    Login response.
    """

    user = LoginUserSerializer(read_only=True)

    tokens = LoginTokensSerializer(read_only=True)
