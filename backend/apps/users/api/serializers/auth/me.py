"""
Serializer for the authenticated user's identity.
"""

from rest_framework import serializers

from apps.users.models import User


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Identity and account status for the signed-in user.

    Deliberately contains identity only. It previously nested the
    profile and the address list, which made the users app import from
    the profiles app - so deleting profiles broke authentication, and
    the auth system could not be reused without dragging an Address
    model along with it.

    Profile data is served by the profiles app at /me/profile/.
    """

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_verified",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_seen",
        )

        read_only_fields = fields
