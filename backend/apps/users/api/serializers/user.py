"""
Serializers for reading the User model.

Read-only by design - a user's identity fields are never edited
through a generic "update user" endpoint. Email changes and
password changes each deserve their own dedicated, more carefully
throttled and verified endpoint (left as a suggested next step).
"""

from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Public representation of a User.
    """

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "is_verified",
            "date_joined",
        )
        read_only_fields = fields
