"""
Admin configuration for Django's built-in Group model.
"""

from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group
from django.db.models import Count, QuerySet

# django.contrib.auth registers its own admin for Group, so replacing it
# means unregistering first. This module was never imported before -
# apps/users/admin/__init__.py only pulled in `user` - so the
# customisation here had never actually taken effect, and the collision
# it causes had never surfaced.
admin.site.unregister(Group)


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin):
    """
    Customized admin interface for Group.
    """

    # ---------------------------------------------------------
    # List View
    # ---------------------------------------------------------

    list_display = (
        "name",
        "user_count",
        "permission_count",
    )

    ordering = ("name",)

    list_per_page = 25

    # ---------------------------------------------------------
    # Searching
    # ---------------------------------------------------------

    search_fields = ("name",)

    # ---------------------------------------------------------
    # Auto Complete
    # ---------------------------------------------------------

    # `autocomplete_fields = ("permissions",)` would require a
    # registered ModelAdmin for Permission, which Django does not ship.
    # The base GroupAdmin's filter_horizontal widget is used instead.
    filter_horizontal = ("permissions",)

    # ---------------------------------------------------------
    # Readonly Fields
    # ---------------------------------------------------------

    readonly_fields = (
        "user_count",
        "permission_count",
    )

    # ---------------------------------------------------------
    # Fieldsets
    # ---------------------------------------------------------

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "permissions",
                ),
            },
        ),
        (
            "Statistics",
            {
                "classes": ("collapse",),
                "fields": (
                    "user_count",
                    "permission_count",
                ),
            },
        ),
    )

    # ---------------------------------------------------------
    # Performance
    # ---------------------------------------------------------

    def get_queryset(self, request) -> QuerySet:
        """
        Optimize queryset.
        """
        queryset = super().get_queryset(request)

        return queryset.prefetch_related(
            "permissions",
            "user_set",
        ).annotate(
            total_users=Count("user", distinct=True),
            total_permissions=Count("permissions", distinct=True),
        )

    # ---------------------------------------------------------
    # Computed Fields
    # ---------------------------------------------------------

    @admin.display(description="Users")
    def user_count(self, obj: Group) -> int:
        """
        Return the number of users in this group.
        """
        return getattr(obj, "total_users", obj.user_set.count())

    @admin.display(description="Permissions")
    def permission_count(self, obj: Group) -> int:
        """
        Return the number of permissions assigned to this group.
        """
        return getattr(
            obj,
            "total_permissions",
            obj.permissions.count(),
        )
