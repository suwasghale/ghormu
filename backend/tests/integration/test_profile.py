"""
Profile and avatar endpoints.
"""

from __future__ import annotations

import io
from datetime import date, timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from apps.profiles.models import Profile

pytestmark = pytest.mark.django_db


@pytest.fixture
def me_url():
    return reverse("v1:profiles:profile")


@pytest.fixture
def avatar_url():
    return reverse("v1:profiles:profile-avatar")


def _image_bytes(
    *,
    size=(64, 64),
    fmt="PNG",
    colour=(255, 0, 0),
) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, colour).save(buffer, format=fmt)
    return buffer.getvalue()


def _upload(name="avatar.png", content=None, content_type="image/png"):
    return SimpleUploadedFile(
        name,
        content if content is not None else _image_bytes(),
        content_type=content_type,
    )


# ------------------------------------------------------------------------------
# Profile creation
# ------------------------------------------------------------------------------


def test_profile_is_created_with_the_user(user):
    assert Profile.objects.filter(user=user).exists()


def test_saving_a_user_does_not_touch_the_profile(user):
    """
    Regression: a post_save receiver ran get_or_create plus a save on
    the profile for every single User write, purely to bump a timestamp
    nothing reads.
    """

    profile = Profile.objects.get(user=user)
    original = profile.updated_at

    user.last_seen = None
    user.save(update_fields=["last_seen"])

    profile.refresh_from_db()

    assert profile.updated_at == original


def test_user_save_issues_no_extra_profile_queries(
    user,
    django_assert_num_queries,
):
    with django_assert_num_queries(1):
        user.save(update_fields=["last_seen"])


# ------------------------------------------------------------------------------
# Read
# ------------------------------------------------------------------------------


def test_profile_endpoint_returns_the_profile(authed_client, me_url):
    response = authed_client.get(me_url)

    assert response.status_code == 200

    data = response.data["data"]

    assert "biography" in data
    assert "avatar" in data


def test_profile_never_exposes_the_password(authed_client, me_url):
    response = authed_client.get(me_url)

    assert "password" not in str(response.data)


def test_profile_requires_authentication(api_client, me_url):
    assert api_client.get(me_url).status_code == 401


# ------------------------------------------------------------------------------
# Update
# ------------------------------------------------------------------------------


def test_update_writes_user_and_profile_fields(
    authed_client,
    me_url,
    user,
):
    response = authed_client.patch(
        me_url,
        {
            "first_name": "  Ada  ",
            "biography": "Engineer.",
        },
        format="json",
    )

    assert response.status_code == 200, response.data

    user.refresh_from_db()

    assert user.first_name == "Ada"
    assert Profile.objects.get(user=user).biography == "Engineer."


def test_preferred_language_defaults_to_nepali(user):
    assert user.profile.preferred_language == "ne"


def test_preferred_language_accepts_only_site_languages(authed_client, me_url):
    response = authed_client.patch(me_url, {"preferred_language": "en"}, format="json")
    assert response.status_code == 200

    response = authed_client.patch(me_url, {"preferred_language": "fr"}, format="json")
    assert response.status_code == 400


def test_update_rejects_an_empty_payload(authed_client, me_url):
    response = authed_client.patch(me_url, {}, format="json")

    assert response.status_code == 400


def test_update_rejects_a_future_date_of_birth(authed_client, me_url):
    """
    This rule lived in Profile.clean(), which no longer runs on save.
    It must be enforced by the serializer or it is not enforced at all.
    """

    response = authed_client.patch(
        me_url,
        {
            "date_of_birth": (date.today() + timedelta(days=1)).isoformat(),
        },
        format="json",
    )

    assert response.status_code == 400
    assert "date_of_birth" in response.data["errors"]


def test_update_rejects_an_implausible_date_of_birth(
    authed_client,
    me_url,
):
    response = authed_client.patch(
        me_url,
        {"date_of_birth": "0202-01-01"},
        format="json",
    )

    assert response.status_code == 400


def test_update_cannot_change_privileged_fields(
    authed_client,
    me_url,
    user,
):
    """
    The serializer declares its fields explicitly, so anything else in
    the payload is ignored rather than assigned.
    """

    authed_client.patch(
        me_url,
        {
            "first_name": "Ada",
            "is_staff": True,
            "is_superuser": True,
            "is_verified": False,
            "email": "attacker@example.test",
        },
        format="json",
    )

    user.refresh_from_db()

    assert user.is_staff is False
    assert user.is_superuser is False
    assert user.is_verified is True
    assert user.email != "attacker@example.test"


# ------------------------------------------------------------------------------
# Avatar
# ------------------------------------------------------------------------------


def test_upload_avatar(authed_client, avatar_url, user):
    response = authed_client.patch(
        avatar_url,
        {"avatar": _upload()},
        format="multipart",
    )

    assert response.status_code == 200, response.data
    assert Profile.objects.get(user=user).avatar


def test_avatar_is_normalised_to_webp(
    authed_client,
    avatar_url,
    user,
):
    authed_client.patch(
        avatar_url,
        {"avatar": _upload(name="photo.png")},
        format="multipart",
    )

    assert Profile.objects.get(user=user).avatar.name.endswith(
        ".webp",
    )


def test_avatar_rejects_a_non_image(authed_client, avatar_url):
    """
    A file claiming to be a PNG through its Content-Type but carrying
    other bytes must be refused. The header is client-supplied and says
    nothing about the content.
    """

    response = authed_client.patch(
        avatar_url,
        {
            "avatar": _upload(
                name="payload.png",
                content=b"#!/bin/sh\necho not an image\n",
            ),
        },
        format="multipart",
    )

    assert response.status_code == 400


def test_avatar_rejects_an_oversized_file(authed_client, avatar_url):
    from apps.profiles.constants import AVATAR_MAX_FILE_SIZE

    response = authed_client.patch(
        avatar_url,
        {
            "avatar": _upload(
                content=b"\x89PNG\r\n\x1a\n" + b"0" * (AVATAR_MAX_FILE_SIZE + 1),
            ),
        },
        format="multipart",
    )

    assert response.status_code == 400


def test_avatar_rejects_a_decompression_bomb(monkeypatch):
    """
    A small file that decodes into an enormous bitmap must be refused
    before the pixels are allocated.
    """

    from core.storage import images

    monkeypatch.setattr(images, "MAX_IMAGE_PIXELS", 1024)

    with pytest.raises(images.InvalidImage):
        images.process_image(
            image_file=io.BytesIO(_image_bytes(size=(256, 256))),
        )


def test_failed_upload_leaves_the_existing_avatar_intact(
    authed_client,
    avatar_url,
    user,
):
    """
    Regression: the old avatar was deleted from storage before the new
    one was validated, so a rejected upload destroyed the current one.
    """

    authed_client.patch(
        avatar_url,
        {"avatar": _upload()},
        format="multipart",
    )

    original = Profile.objects.get(user=user).avatar.name

    authed_client.patch(
        avatar_url,
        {"avatar": _upload(content=b"still not an image")},
        format="multipart",
    )

    assert Profile.objects.get(user=user).avatar.name == original


def test_delete_avatar(authed_client, avatar_url, user):
    authed_client.patch(
        avatar_url,
        {"avatar": _upload()},
        format="multipart",
    )

    response = authed_client.delete(avatar_url)

    assert response.status_code == 200
