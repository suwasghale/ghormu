"""
Admin serializer for user accounts.

This is the one admin resource that can escalate privilege, so it is the
one with a hand-written field list rather than ``__all__``. Three rules
are enforced here, and none of them are cosmetic:

* **The password is never readable and never writable through this
  endpoint.** Changing someone else's password is a credential-reset
  flow with its own audit trail, not a field on an edit form.

* **Only a superuser may grant staff or superuser status.** Otherwise
  any staff account is one PATCH away from becoming a superuser, and
  the staff/superuser distinction means nothing.

* **Nobody may demote or deactivate themselves.** An admin who removes
  their own last privilege locks everyone out of the tool that would
  fix it.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.api.admin_serializers import AdminModelSerializer

User = get_user_model()

#: Fields only a superuser may change.
PRIVILEGE_FIELDS = ("is_staff", "is_superuser")


class UserAdminSerializer(AdminModelSerializer):
    """
    A user account as the admin UI sees it.
    """

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_verified",
            "last_login",
            "last_seen",
            "date_joined",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "last_login",
            "last_seen",
            "date_joined",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, user) -> str:
        return f"{user.first_name} {user.last_name}".strip() or user.email

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate(self, attrs):
        attrs = super().validate(attrs)

        request = self.context.get("request")
        actor = getattr(request, "user", None)

        self._check_privilege_grants(attrs, actor)
        self._check_self_lockout(attrs, actor)

        return attrs

    @staticmethod
    def _check_privilege_grants(attrs: dict, actor) -> None:
        changing = [field for field in PRIVILEGE_FIELDS if field in attrs]

        if not changing:
            return

        if actor is not None and actor.is_superuser:
            return

        raise serializers.ValidationError(
            dict.fromkeys(changing, "Only a superuser can change this."),
        )

    def _check_self_lockout(self, attrs: dict, actor) -> None:
        editing_self = (
            self.instance is not None
            and actor is not None
            and self.instance.pk == actor.pk
        )

        if not editing_self:
            return

        removals = {
            "is_active": "deactivate",
            "is_staff": "remove your own staff access from",
            "is_superuser": "remove your own superuser access from",
        }

        for field, verb in removals.items():
            if field in attrs and not attrs[field]:
                raise serializers.ValidationError(
                    {field: f"You cannot {verb} your own account."},
                )
