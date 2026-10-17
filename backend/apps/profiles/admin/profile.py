"""
Admin configuration for the Profile model.
"""

from django.contrib import admin
from django.db.models import QuerySet
from django.utils.html import format_html

from apps.profiles.models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for Profile.
    """

    # ---------------------------------------------------------
    # List View
    # ---------------------------------------------------------

    list_display = (
        "avatar_preview",
        "user",
        "phone_number",
        "gender",
        "nationality",
        "preferred_language",
        "timezone",
        "created_at",
    )

    list_display_links = (
        "avatar_preview",
        "user",
    )

    ordering = ("-created_at",)

    list_per_page = 25

    # ---------------------------------------------------------
    # Searching
    # ---------------------------------------------------------

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone_number",
    )

    # ---------------------------------------------------------
    # Filtering
    # ---------------------------------------------------------

    list_filter = (
        "gender",
        "preferred_language",
        "nationality",
        "created_at",
    )

    date_hierarchy = "created_at"

    # ---------------------------------------------------------
    # Readonly Fields
    # ---------------------------------------------------------

    readonly_fields = (
        "avatar_preview",
        "created_at",
        "updated_at",
        "age",
    )

    # ---------------------------------------------------------
    # Auto Complete
    # ---------------------------------------------------------

    autocomplete_fields = ("user",)

    # ---------------------------------------------------------
    # Fieldsets
    # ---------------------------------------------------------

    fieldsets = (
        (
            "User",
            {
                "fields": ("user",),
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "avatar",
                    "avatar_preview",
                    "gender",
                    "date_of_birth",
                    "age",
                ),
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "phone_number",
                    "nationality",
                ),
            },
        ),
        (
            "Biography",
            {
                "fields": ("biography",),
            },
        ),
        (
            "Preferences",
            {
                "fields": (
                    "preferred_language",
                    "timezone",
                ),
            },
        ),
        (
            "System Information",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    # ---------------------------------------------------------
    # Performance
    # ---------------------------------------------------------

    @admin.display(description="Avatar")
    def avatar_preview(self, obj: Profile) -> str:
        """
        Display avatar thumbnail.
        """

        if obj.avatar:
            return format_html(
                '<img src="{}" width="45" height="45" '
                'style="border-radius:50%; object-fit:cover;" />',
                obj.avatar.url,
            )

        return "—"

    def get_queryset(self, request) -> QuerySet:
        """
        Optimize queryset.
        """

        queryset = super().get_queryset(request)

        return queryset.select_related("user")
