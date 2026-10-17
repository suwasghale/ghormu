"""Identity administration is separate from editorial staff access."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class CanManageAccounts(BasePermission):
    message = "Only a superuser can change user accounts."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_staff
            and (request.method in SAFE_METHODS or user.is_superuser)
        )
