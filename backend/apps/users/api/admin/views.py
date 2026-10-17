"""
Admin endpoints for user accounts.

    GET|POST         /api/v1/admin/users/
    GET|PATCH|DELETE /api/v1/admin/users/<id>/

Creating a user here is deliberately not supported: an account without a
password and without a verification email is a half-account, and the
register/invite flow already exists. The list view is read-only.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.api.admin.permissions import CanManageAccounts
from apps.users.api.admin.serializers import UserAdminSerializer
from core.api.admin import AdminDetailAPIView, AdminListCreateAPIView

User = get_user_model()


class _UserConfig:
    permission_classes = (IsAuthenticated, CanManageAccounts)
    model = User
    serializer_class = UserAdminSerializer

    search_fields = ("email", "first_name", "last_name")

    filter_fields = ("is_active", "is_staff", "is_superuser", "is_verified")

    ordering_fields = (
        "email",
        "first_name",
        "last_name",
        "date_joined",
        "last_login",
        "last_seen",
        "created_at",
    )

    default_ordering = ("-date_joined",)

    # Users are not site content; nothing to rebuild.
    revalidate_tag = ""


class UserAdminListAPIView(_UserConfig, AdminListCreateAPIView):
    """
    User accounts.
    """

    def post(self, request, *args, **kwargs):
        return Response(
            {
                "success": False,
                "message": (
                    "Accounts are created through registration or an "
                    "invitation, not here."
                ),
                "errors": {},
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class UserAdminDetailAPIView(_UserConfig, AdminDetailAPIView):
    """
    One user account.

    Deletion is a soft delete: the model carries `deleted_at`, and rows
    referenced by sessions, security events and audit history must not
    vanish from under them.
    """

    def delete(self, request, *args, **kwargs):
        user = self.get_object()

        if user.pk == request.user.pk:
            return Response(
                {
                    "success": False,
                    "message": "You cannot delete your own account.",
                    "errors": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate rather than destroy. A staff member who leaves must
        # stop being able to log in; their audit trail must survive.
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Account deactivated.",
                "data": None,
            },
            status=status.HTTP_200_OK,
        )
