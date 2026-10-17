"""
Custom Django Admin configuration for the User model.

This module customizes the Django admin interface for the project's
custom User model. It provides:

- Email-based authentication support
- Organized fieldsets
- Optimized list display
- Search functionality
- Filtering
- Read-only audit fields
- Better usability for administrators
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.users.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for the custom User model.
    """

    # A change_user grant must not become a way around the API policy.
    def has_add_permission(self, request):
        return request.user.is_superuser and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser and super().has_delete_permission(request, obj)

    # ------------------------------------------------------------------
    # List View
    # ------------------------------------------------------------------

    list_display = (
        "email",
        "full_name",
        "is_verified",
        "is_active",
        "is_staff",
        "is_superuser",
        "last_login",
        "date_joined",
    )

    list_display_links = ("email",)

    list_filter = (
        "is_active",
        "is_verified",
        "is_staff",
        "is_superuser",
        "date_joined",
        "last_login",
    )

    search_fields = (
        "email",
        "first_name",
        "last_name",
    )

    ordering = ("-created_at",)

    list_per_page = 25

    list_max_show_all = 100

    save_on_top = True

    # ------------------------------------------------------------------
    # Read-only Fields
    # ------------------------------------------------------------------

    readonly_fields = (
        "id",
        "last_login",
        "last_seen",
        "date_joined",
        "created_at",
        "updated_at",
    )

    # ------------------------------------------------------------------
    # Fieldsets (Edit Page)
    # ------------------------------------------------------------------

    fieldsets = (
        (
            "Authentication",
            {
                "fields": (
                    "email",
                    "password",
                ),
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                ),
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            "Activity",
            {
                "fields": (
                    "last_login",
                    "last_seen",
                    "date_joined",
                ),
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    # ------------------------------------------------------------------
    # Add User Page
    # ------------------------------------------------------------------

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )

    # ------------------------------------------------------------------
    # Performance
    # ------------------------------------------------------------------

    filter_horizontal = (
        "groups",
        # "user_permissions",
    )

    autocomplete_fields = (
        "groups",
        # "user_permissions",
    )
