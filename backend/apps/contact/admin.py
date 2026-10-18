"""
Django admin fallback for the contact inbox.
"""

from django.contrib import admin

from apps.contact.models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "topic", "email", "phone", "handled", "created_at")
    list_filter = ("topic", "handled", "language")
    search_fields = ("name", "email", "phone", "message")
    readonly_fields = (
        "name",
        "email",
        "phone",
        "topic",
        "message",
        "language",
        "created_at",
    )
