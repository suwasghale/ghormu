"""
Staff endpoints for the website's content.

    GET|POST         /api/v1/admin/<resource>/
    GET|PATCH|DELETE /api/v1/admin/<resource>/<id>/

for ``posts``, ``events``, ``projects``, ``archive`` and ``places``. Every write
rebuilds the affected pages on the frontend (see ``core.api.admin``).
"""

from __future__ import annotations

from apps.public_content.api.serializers import (
    ArchiveItemAdminSerializer,
    EventAdminSerializer,
    MapPlaceAdminSerializer,
    PostAdminSerializer,
    ProjectAdminSerializer,
)
from apps.public_content.models import ArchiveItem, Event, MapPlace, Post, Project
from core.api.admin import AdminDetailAPIView, AdminListCreateAPIView


class _PostConfig:
    model = Post
    serializer_class = PostAdminSerializer
    search_fields = ("title_ne", "title_en", "slug")
    filter_fields = ("kind", "status", "is_pinned")
    ordering_fields = ("published_at", "created_at", "title_ne")
    default_ordering = ("-created_at",)
    revalidate_tag = "posts"
    revalidate_extra_paths = ("/", "/updates", "/updates/announcements")


class _EventConfig:
    model = Event
    serializer_class = EventAdminSerializer
    search_fields = ("title_ne", "title_en", "location_ne", "location_en")
    filter_fields = ("category", "status")
    ordering_fields = ("starts_on", "created_at")
    default_ordering = ("-starts_on",)
    revalidate_tag = "events"
    revalidate_extra_paths = ("/community/events",)


class _ProjectConfig:
    model = Project
    serializer_class = ProjectAdminSerializer
    search_fields = ("title_ne", "title_en")
    filter_fields = ("stage", "status")
    ordering_fields = ("started_on", "created_at", "progress")
    default_ordering = ("-created_at",)
    revalidate_tag = "projects"
    revalidate_extra_paths = ("/updates/development",)


class _ArchiveConfig:
    model = ArchiveItem
    serializer_class = ArchiveItemAdminSerializer
    search_fields = ("title_ne", "title_en", "credit", "place_ne", "place_en")
    filter_fields = ("kind", "status", "consent_confirmed")
    ordering_fields = ("year", "created_at")
    default_ordering = ("-created_at",)
    revalidate_tag = "archive"
    revalidate_extra_paths = ("/", "/about/archive")


class _MapPlaceConfig:
    model = MapPlace
    serializer_class = MapPlaceAdminSerializer
    search_fields = ("name_ne", "name_en")
    filter_fields = ("category", "status")
    ordering_fields = ("sort_order", "name_ne", "created_at")
    default_ordering = ("sort_order", "name_ne")
    revalidate_tag = "places"
    revalidate_extra_paths = ("/explore/map",)


class PostAdminListAPIView(_PostConfig, AdminListCreateAPIView):
    """News and announcements."""


class PostAdminDetailAPIView(_PostConfig, AdminDetailAPIView):
    """One post."""


class EventAdminListAPIView(_EventConfig, AdminListCreateAPIView):
    """Events."""


class EventAdminDetailAPIView(_EventConfig, AdminDetailAPIView):
    """One event."""


class ProjectAdminListAPIView(_ProjectConfig, AdminListCreateAPIView):
    """Development projects."""


class ProjectAdminDetailAPIView(_ProjectConfig, AdminDetailAPIView):
    """One project."""


class ArchiveAdminListAPIView(_ArchiveConfig, AdminListCreateAPIView):
    """Archive items."""


class ArchiveAdminDetailAPIView(_ArchiveConfig, AdminDetailAPIView):
    """One archive item."""


class MapPlaceAdminListAPIView(_MapPlaceConfig, AdminListCreateAPIView):
    """Places on the village map."""


class MapPlaceAdminDetailAPIView(_MapPlaceConfig, AdminDetailAPIView):
    """One map place."""
