"""
The contact form and the staff inbox.
"""

from __future__ import annotations

import pytest
from django.core import mail

from apps.contact.models import ContactMessage
from tests.factories import StaffUserFactory, UserFactory

pytestmark = pytest.mark.django_db

URL = "/api/v1/contact/"

VALID = {
    "name": "राम घले",
    "email": "Ram@Example.com",
    "topic": "feedback",
    "message": "वेबसाइट राम्रो छ। धन्यवाद!",
    "language": "ne",
}


def test_a_message_is_stored_and_staff_are_emailed(
    api_client, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.post(URL, VALID, format="json")

    assert response.status_code == 201, response.content

    message = ContactMessage.objects.get()
    assert message.email == "ram@example.com"
    assert message.topic == "feedback"
    assert message.handled is False

    assert len(mail.outbox) == 1
    assert "वेबसाइट राम्रो छ" in mail.outbox[0].body
    assert str(message.pk) in mail.outbox[0].body


def test_a_phone_number_is_enough_to_reply(api_client):
    response = api_client.post(
        URL, {**VALID, "email": "", "phone": "+977 980-0000000"}, format="json"
    )

    assert response.status_code == 201


def test_some_way_to_reply_is_required(api_client):
    response = api_client.post(URL, {**VALID, "email": "", "phone": ""}, format="json")

    assert response.status_code == 400
    assert "email" in response.data["errors"]


def test_markup_in_a_message_is_stored_as_plain_text(api_client):
    api_client.post(
        URL,
        {**VALID, "message": "<script>alert(1)</script>नमस्ते, <b>गाउँ</b>"},
        format="json",
    )

    assert ContactMessage.objects.get().message == "नमस्ते, गाउँ"


def test_the_honeypot_is_accepted_but_discarded(
    api_client, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.post(
            URL, {**VALID, "website": "http://spam.example"}, format="json"
        )

    assert response.status_code == 201
    assert not ContactMessage.objects.exists()
    assert mail.outbox == []


def test_the_form_is_rate_limited(api_client, monkeypatch):
    from core.api.throttles import SubmissionThrottle

    monkeypatch.setattr(SubmissionThrottle, "rate", "2/hour", raising=False)

    statuses = [
        api_client.post(URL, VALID, format="json").status_code for _ in range(3)
    ]

    assert statuses == [201, 201, 429]


def test_the_inbox_is_staff_only(api_client):
    assert api_client.get("/api/v1/admin/messages/").status_code == 401

    api_client.force_authenticate(UserFactory())
    assert api_client.get("/api/v1/admin/messages/").status_code == 403


def test_staff_can_mark_a_message_handled_but_not_rewrite_it(api_client):
    message = ContactMessage.objects.create(
        name="राम", email="ram@example.com", message="नमस्ते, कस्तो छ?"
    )
    api_client.force_authenticate(StaffUserFactory())

    response = api_client.patch(
        f"/api/v1/admin/messages/{message.pk}/",
        {"handled": True, "message": "changed"},
        format="json",
    )

    assert response.status_code == 200
    message.refresh_from_db()
    assert message.handled is True
    assert message.message == "नमस्ते, कस्तो छ?"


def test_staff_cannot_create_messages(api_client):
    api_client.force_authenticate(StaffUserFactory())

    assert (
        api_client.post("/api/v1/admin/messages/", VALID, format="json").status_code
        == 405
    )
