"""
Reusable DRF permission classes.

Django already ships groups and per-model permissions, and this project
does not replace them. What it adds is the small set of checks every
API needs and DRF does not provide: object ownership, verified-email
gating, and read-only-for-everyone-else.

Anything richer - organisations, teams, per-tenant roles - is
application specific and belongs in the app that owns the concept, not
here.
"""

from __future__ import annotations

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwner(BasePermission):
    """
    Allow access only to the object's owner.

    A backstop, not the primary control. Object permissions run *after*
    the object has been fetched, so a view relying on this alone still
    reads rows belonging to other people and answers 403 where 404
    belongs - which confirms the id exists. Scope the queryset by owner
    as well; see apps/profiles/api/views/address/base.py.
    """

    owner_field = "user_id"

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj) -> bool:
        owner_field = getattr(view, "owner_field", self.owner_field)

        owner_id = getattr(obj, owner_field, None)

        # A model whose owner *is* the user record.
        if owner_id is None and hasattr(obj, "pk"):
            owner_id = obj.pk

        return owner_id == request.user.id


class IsOwnerOrReadOnly(IsOwner):
    """
    Anyone authenticated may read; only the owner may write.
    """

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True

        return super().has_object_permission(request, view, obj)


class IsVerified(BasePermission):
    """
    Require a verified email address.

    Login already refuses unverified accounts, so this matters for
    flows that mint a session another way - social sign-in with an
    unverified provider address, or an invitation link.
    """

    message = "Please verify your email address to continue."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and request.user.is_authenticated and request.user.is_verified
        )


class IsStaff(BasePermission):
    """
    Require staff status.
    """

    message = "This action requires staff access."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class HasGroup(BasePermission):
    """
    Require membership of a named Django group.

    Use as a factory:

        permission_classes = (HasGroup.named("editors"),)

    Group membership is cached on the request, so repeated checks in
    one request do not re-query.
    """

    group_name: str = ""

    message = "You are not a member of the required group."

    @classmethod
    def named(cls, group_name: str) -> type[HasGroup]:
        return type(
            f"HasGroup_{group_name}",
            (cls,),
            {"group_name": group_name},
        )

    def has_permission(self, request, view) -> bool:
        user = request.user

        if not (user and user.is_authenticated):
            return False

        if user.is_superuser:
            return True

        cached = getattr(request, "_group_names", None)

        if cached is None:
            cached = set(
                user.groups.values_list("name", flat=True),
            )
            request._group_names = cached

        return self.group_name in cached


#: Roles declared through `core.roles` become Django groups, so the
#: group check is also the role check. Aliased for readability at call
#: sites that think in roles rather than groups.
HasRole = HasGroup
