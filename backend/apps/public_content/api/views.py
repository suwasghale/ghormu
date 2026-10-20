"""
Public, read-only content for the website.

    GET /api/v1/content/posts/?kind=news|announcement
    GET /api/v1/content/posts/<slug>/
    GET /api/v1/content/events/?when=upcoming|past
    GET /api/v1/content/projects/?stage=planned|ongoing|completed
    GET /api/v1/content/archive/?kind=photo|document|map|satellite&decade=1990
    GET /api/v1/content/archive/<slug>/
    GET /api/v1/content/places/?category=school|sacred|...

Anonymous, cacheable and language-aware (``?lang=ne|en``); see
``core.api.public``.
"""

from __future__ import annotations

from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import OpenApiParameter, extend_schema

from apps.public_content import selectors
from apps.public_content.api.serializers import (
    ArchiveItemSerializer,
    EventSerializer,
    MapPlaceSerializer,
    PostDetailSerializer,
    PostListSerializer,
    ProjectSerializer,
)
from apps.public_content.choices import (
    ArchiveKindChoices,
    MapPlaceCategoryChoices,
    PostKindChoices,
    ProjectStageChoices,
)
from core.api.public import PublicContentAPIView
from core.api.responses import SuccessResponse
from core.exceptions import NotFound


def _choice(value: str | None, choices) -> str | None:
    """An allowed filter value, or nothing: a bad filter is ignored, not a 400."""

    return value if value in choices.values else None


class _ListSchema(AutoSchema):
    """
    These are plain views, not ViewSets, so spectacular cannot tell a list
    from a detail and documents every GET as a single object.
    """

    def _is_list_view(self, serializer=None):
        return self.method == "GET" or super()._is_list_view(serializer)


class _ListView(PublicContentAPIView):
    schema = _ListSchema()

    def get(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class PostListAPIView(_ListView):
    serializer_class = PostListSerializer

    @extend_schema(
        parameters=[
            PublicContentAPIView.language_parameter(),
            OpenApiParameter("kind", str, enum=list(PostKindChoices.values)),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return selectors.published_posts(
            kind=_choice(self.request.query_params.get("kind"), PostKindChoices)
        )


class PostDetailAPIView(PublicContentAPIView):
    serializer_class = PostDetailSerializer

    @extend_schema(parameters=[PublicContentAPIView.language_parameter()])
    def get(self, request, slug: str, *args, **kwargs):
        post = selectors.published_post(slug)

        if post is None:
            raise NotFound("Post not found.")

        return SuccessResponse.ok(data=self.get_serializer(post).data)


class EventListAPIView(_ListView):
    serializer_class = EventSerializer

    @extend_schema(
        parameters=[
            PublicContentAPIView.language_parameter(),
            OpenApiParameter("when", str, enum=["upcoming", "past"]),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        when = self.request.query_params.get("when")
        return selectors.published_events(
            when=when if when in ("upcoming", "past") else None
        )


class ProjectListAPIView(_ListView):
    serializer_class = ProjectSerializer

    @extend_schema(
        parameters=[
            PublicContentAPIView.language_parameter(),
            OpenApiParameter("stage", str, enum=list(ProjectStageChoices.values)),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return selectors.published_projects(
            stage=_choice(self.request.query_params.get("stage"), ProjectStageChoices)
        )


class ArchiveListAPIView(_ListView):
    serializer_class = ArchiveItemSerializer

    @extend_schema(
        parameters=[
            PublicContentAPIView.language_parameter(),
            OpenApiParameter("kind", str, enum=list(ArchiveKindChoices.values)),
            OpenApiParameter(
                "decade", int, description="First year of a decade, e.g. 1990."
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        decade = self.request.query_params.get("decade", "")
        return selectors.published_archive(
            kind=_choice(self.request.query_params.get("kind"), ArchiveKindChoices),
            decade=int(decade) // 10 * 10 if decade.isdigit() else None,
        )


class ArchiveDetailAPIView(PublicContentAPIView):
    serializer_class = ArchiveItemSerializer

    @extend_schema(parameters=[PublicContentAPIView.language_parameter()])
    def get(self, request, slug: str, *args, **kwargs):
        item = selectors.published_archive_item(slug)

        if item is None:
            raise NotFound("Archive item not found.")

        return SuccessResponse.ok(data=self.get_serializer(item).data)


class MapPlaceListAPIView(_ListView):
    serializer_class = MapPlaceSerializer

    @extend_schema(
        parameters=[
            PublicContentAPIView.language_parameter(),
            OpenApiParameter(
                "category", str, enum=list(MapPlaceCategoryChoices.values)
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return selectors.published_places(
            category=_choice(
                self.request.query_params.get("category"), MapPlaceCategoryChoices
            )
        )
