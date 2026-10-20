"""
Read queries for the public site.

Every function starts from ``published()``: a draft, an archived row or one
scheduled for later is never returned, whoever asks.
"""

from __future__ import annotations

from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.public_content.choices import ArchiveKindChoices
from apps.public_content.models import ArchiveItem, Event, MapPlace, Post, Project


def published_posts(*, kind: str | None = None) -> QuerySet[Post]:
    queryset = Post.objects.published()

    if kind:
        queryset = queryset.filter(kind=kind)

    return queryset.order_by("-is_pinned", "-published_at")


def published_post(slug: str) -> Post | None:
    return Post.objects.published().filter(slug=slug).first()


def published_events(*, when: str | None = None) -> QuerySet[Event]:
    """
    ``upcoming`` includes an event still running today; ``past`` is
    newest first, because last month's festival matters more than one
    from five years ago.
    """

    queryset = Event.objects.published()
    today = timezone.localdate()
    still_on = Q(ends_on__gte=today) | Q(ends_on__isnull=True, starts_on__gte=today)

    if when == "upcoming":
        return queryset.filter(still_on).order_by("starts_on")

    if when == "past":
        return queryset.exclude(still_on).order_by("-starts_on")

    return queryset.order_by("starts_on")


def published_projects(*, stage: str | None = None) -> QuerySet[Project]:
    queryset = Project.objects.published()

    if stage:
        queryset = queryset.filter(stage=stage)

    return queryset.order_by("stage", "-started_on", "-published_at")


def published_archive(
    *, kind: str | None = None, decade: int | None = None
) -> QuerySet[ArchiveItem]:
    """
    The archive proper excludes satellite views unless they are asked for;
    those are shown separately as "Ghormu through time".
    """

    queryset = ArchiveItem.objects.published().filter(consent_confirmed=True)

    if kind:
        queryset = queryset.filter(kind=kind)
    else:
        queryset = queryset.exclude(kind=ArchiveKindChoices.SATELLITE)

    if decade is not None:
        queryset = queryset.filter(year__gte=decade, year__lt=decade + 10)

    return queryset.order_by("year", "created_at")


def published_archive_item(slug: str) -> ArchiveItem | None:
    return (
        ArchiveItem.objects.published()
        .filter(consent_confirmed=True, slug=slug)
        .first()
    )


def published_places(*, category: str | None = None) -> QuerySet[MapPlace]:
    queryset = MapPlace.objects.published()

    if category:
        queryset = queryset.filter(category=category)

    return queryset.order_by("sort_order", "name_ne")
