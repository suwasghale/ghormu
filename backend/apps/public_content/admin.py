"""
Django admin: a fallback editor at /django-admin/. Day-to-day editing
happens in the site's own admin at /admin.
"""

from django.contrib import admin

from apps.public_content.models import ArchiveItem, Event, Post, Project


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "title_ne",
        "title_en",
        "kind",
        "status",
        "is_pinned",
        "published_at",
    )
    list_filter = ("kind", "status", "is_pinned")
    search_fields = ("title_ne", "title_en", "slug")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title_ne", "category", "starts_on", "ends_on", "status")
    list_filter = ("category", "status")
    search_fields = ("title_ne", "title_en")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title_ne", "stage", "progress", "status")
    list_filter = ("stage", "status")
    search_fields = ("title_ne", "title_en")


@admin.register(ArchiveItem)
class ArchiveItemAdmin(admin.ModelAdmin):
    list_display = ("title_ne", "kind", "year", "consent_confirmed", "status")
    list_filter = ("kind", "status", "consent_confirmed")
    search_fields = ("title_ne", "title_en", "credit")
