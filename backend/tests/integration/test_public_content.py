"""
The public website's content: what visitors can see, and who can edit it.
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.public_content.models import ArchiveItem, Event, Post, Project
from tests.factories import StaffUserFactory, UserFactory

pytestmark = pytest.mark.django_db

PUBLISHED = {"status": "published"}


def _results(response):
    assert response.status_code == 200, response.content
    return response.data["data"]["results"]


# =============================================================================
# Visibility
# =============================================================================


def test_only_published_posts_are_public(api_client):
    Post.objects.create(title_ne="प्रकाशित", title_en="Published", **PUBLISHED)
    Post.objects.create(title_ne="मस्यौदा", title_en="Draft")
    Post.objects.create(
        title_ne="पछि",
        title_en="Scheduled",
        status="published",
        published_at=timezone.now() + timedelta(days=1),
    )

    titles = [
        row["title"]
        for row in _results(api_client.get("/api/v1/content/posts/?lang=en"))
    ]

    assert titles == ["Published"]


def test_a_draft_post_page_is_not_found(api_client):
    post = Post.objects.create(title_ne="मस्यौदा", title_en="Secret draft")

    assert api_client.get(f"/api/v1/content/posts/{post.slug}/").status_code == 404


def test_posts_are_served_in_the_requested_language_with_nepali_fallback(api_client):
    post = Post.objects.create(
        title_ne="गाउँ सभा", title_en="", summary_ne="सबै आउनुहोस्", **PUBLISHED
    )

    nepali = api_client.get(f"/api/v1/content/posts/{post.slug}/?lang=ne").data["data"]
    english = api_client.get(f"/api/v1/content/posts/{post.slug}/?lang=en").data["data"]

    assert nepali["title"] == "गाउँ सभा"
    # No English yet: the Nepali text, not a blank heading.
    assert english["title"] == "गाउँ सभा"


def test_posts_filter_by_kind_and_pinned_first(api_client):
    Post.objects.create(title_ne="क", title_en="Old news", **PUBLISHED)
    Post.objects.create(
        title_ne="ख", title_en="Notice", kind="announcement", **PUBLISHED
    )
    Post.objects.create(
        title_ne="ग", title_en="Pinned news", is_pinned=True, **PUBLISHED
    )

    news = [
        row["title"]
        for row in _results(api_client.get("/api/v1/content/posts/?kind=news&lang=en"))
    ]

    assert news == ["Pinned news", "Old news"]


def test_post_body_is_sanitised_on_save():
    post = Post.objects.create(
        title_ne="क", body_ne='<p onclick="x()">नमस्ते</p><script>alert(1)</script>'
    )

    assert "<script>" not in post.body_ne
    assert "onclick" not in post.body_ne
    assert "नमस्ते" in post.body_ne


def test_post_slug_comes_from_the_english_title_and_stays_unique():
    first = Post.objects.create(title_ne="क", title_en="Village Meeting")
    second = Post.objects.create(title_ne="ख", title_en="Village Meeting")
    nepali_only = Post.objects.create(title_ne="गाउँ सभा")

    assert first.slug == "village-meeting"
    assert second.slug == "village-meeting-2"
    assert nepali_only.slug.startswith("post-")


def test_events_split_into_upcoming_and_past(api_client):
    today = timezone.localdate()
    Event.objects.create(
        title_ne="आगामी",
        title_en="Upcoming",
        starts_on=today + timedelta(days=5),
        **PUBLISHED,
    )
    Event.objects.create(
        title_ne="चलिरहेको",
        title_en="Running",
        starts_on=today - timedelta(days=1),
        ends_on=today + timedelta(days=1),
        **PUBLISHED,
    )
    Event.objects.create(
        title_ne="सकिएको",
        title_en="Past",
        starts_on=today - timedelta(days=30),
        **PUBLISHED,
    )

    upcoming = [
        row["title"]
        for row in _results(
            api_client.get("/api/v1/content/events/?when=upcoming&lang=en")
        )
    ]
    past = [
        row["title"]
        for row in _results(api_client.get("/api/v1/content/events/?when=past&lang=en"))
    ]

    assert upcoming == ["Running", "Upcoming"]
    assert past == ["Past"]


def test_completed_projects_report_full_progress(api_client):
    Project.objects.create(title_ne="खानेपानी", stage="completed", **PUBLISHED)

    (project,) = _results(api_client.get("/api/v1/content/projects/"))

    assert project["progress"] == 100


def test_archive_hides_items_without_consent_and_satellite_views(api_client):
    ArchiveItem.objects.create(
        title_ne="सहमति",
        title_en="Consented",
        consent_confirmed=True,
        year=1990,
        **PUBLISHED,
    )
    ArchiveItem.objects.create(
        title_ne="बिना", title_en="No consent", year=1991, **PUBLISHED
    )
    ArchiveItem.objects.create(
        title_ne="भू-उपग्रह",
        title_en="Satellite",
        kind="satellite",
        year=2006,
        credit="Imagery: Google, Maxar Technologies",
        consent_confirmed=True,
        **PUBLISHED,
    )

    archive = [
        row["title"]
        for row in _results(api_client.get("/api/v1/content/archive/?lang=en"))
    ]
    satellite = [
        row["title"]
        for row in _results(
            api_client.get("/api/v1/content/archive/?kind=satellite&lang=en")
        )
    ]

    assert archive == ["Consented"]
    assert satellite == ["Satellite"]


def test_archive_filters_by_decade(api_client):
    ArchiveItem.objects.create(
        title_ne="क", title_en="1985", year=1985, consent_confirmed=True, **PUBLISHED
    )
    ArchiveItem.objects.create(
        title_ne="ख", title_en="1993", year=1993, consent_confirmed=True, **PUBLISHED
    )

    nineties = [
        row["title"]
        for row in _results(
            api_client.get("/api/v1/content/archive/?decade=1997&lang=en")
        )
    ]

    assert nineties == ["1993"]


def test_public_reads_are_cacheable_per_language(api_client):
    response = api_client.get("/api/v1/content/posts/")

    assert "public" in response["Cache-Control"]
    assert "Accept-Language" in response["Vary"]


# =============================================================================
# Editing
# =============================================================================


@pytest.mark.parametrize("resource", ["posts", "events", "projects", "archive"])
def test_content_admin_is_staff_only(api_client, resource):
    url = f"/api/v1/admin/{resource}/"

    assert api_client.get(url).status_code == 401

    api_client.force_authenticate(UserFactory())
    assert api_client.get(url).status_code == 403

    api_client.force_authenticate(StaffUserFactory())
    assert api_client.get(url).status_code == 200


def test_staff_can_publish_a_post(api_client):
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.post(
        "/api/v1/admin/posts/",
        {"title_ne": "गाउँ सभा", "title_en": "Village meeting", "status": "published"},
        format="json",
    )

    assert response.status_code == 201, response.content
    assert Post.objects.published().filter(slug="village-meeting").exists()


def test_a_post_cannot_take_a_reserved_address(api_client):
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.post(
        "/api/v1/admin/posts/",
        {"title_ne": "क", "slug": "announcements"},
        format="json",
    )

    assert response.status_code == 400
    assert "slug" in response.data["errors"]


def test_an_archive_item_needs_consent_before_publishing(api_client):
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.post(
        "/api/v1/admin/archive/",
        {"title_ne": "पुरानो तस्बिर", "status": "published"},
        format="json",
    )

    assert response.status_code == 400
    assert "consent_confirmed" in response.data["errors"]


def test_a_satellite_image_needs_its_credit_and_year(api_client):
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.post(
        "/api/v1/admin/archive/",
        {"title_ne": "भू-उपग्रह", "kind": "satellite", "consent_confirmed": True},
        format="json",
    )

    assert response.status_code == 400
    assert {"credit", "year"} <= set(response.data["errors"])


def test_an_event_cannot_end_before_it_starts(api_client):
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.post(
        "/api/v1/admin/events/",
        {"title_ne": "क", "starts_on": "2026-11-10", "ends_on": "2026-11-01"},
        format="json",
    )

    assert response.status_code == 400
    assert "ends_on" in response.data["errors"]


def test_image_addresses_must_be_uploads_or_https(api_client):
    api_client.force_authenticate(StaffUserFactory())

    bad = api_client.post(
        "/api/v1/admin/posts/",
        {"title_ne": "क", "image_url": "javascript:alert(1)"},
        format="json",
    )
    good = api_client.post(
        "/api/v1/admin/posts/",
        {"title_ne": "ख", "image_url": "/api/media/uploads/a.webp"},
        format="json",
    )

    assert bad.status_code == 400
    assert good.status_code == 201
