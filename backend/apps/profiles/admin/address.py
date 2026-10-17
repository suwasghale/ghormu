"""
Admin configuration for the Address model.
"""

from django.contrib import admin
from django.db.models import QuerySet

from apps.profiles.models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """
    Admin configuration for Address.
    """

    # ---------------------------------------------------------
    # List View
    # ---------------------------------------------------------

    list_display = (
        "user",
        "address_type",
        "label",
        "city",
        "country",
        "is_default",
        "created_at",
    )

    list_display_links = (
        "user",
        "address_type",
    )

    ordering = (
        "-is_default",
        "-created_at",
    )

    list_per_page = 25

    # ---------------------------------------------------------
    # Searching
    # ---------------------------------------------------------

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "city",
        "country",
        "postal_code",
        "street_address",
    )

    # ---------------------------------------------------------
    # Filtering
    # ---------------------------------------------------------

    list_filter = (
        "address_type",
        "country",
        "is_default",
        "created_at",
    )

    date_hierarchy = "created_at"

    # ---------------------------------------------------------
    # Readonly Fields
    # ---------------------------------------------------------

    readonly_fields = (
        "created_at",
        "updated_at",
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
            "Address",
            {
                "fields": (
                    "address_type",
                    "label",
                    "street_address",
                    "address_line_2",
                    "city",
                    "state",
                    "postal_code",
                    "country",
                ),
            },
        ),
        (
            "Options",
            {
                "fields": ("is_default",),
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

    def get_queryset(self, request) -> QuerySet:
        """
        Optimize queryset.
        """
        queryset = super().get_queryset(request)
        return queryset.select_related("user")
