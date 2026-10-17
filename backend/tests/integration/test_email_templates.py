"""
Email rendering.

Templates are only exercised through Celery tasks, so a broken one
surfaces as a failed job rather than a failed request. These tests
render every template for real and assert on the output.
"""

from __future__ import annotations

import pytest
from django.core import mail
from django.test import override_settings

from apps.users.tasks.emails import (
    send_email_change_verification_email,
    send_email_verification_email,
    send_password_reset_email,
    send_welcome_email,
)

pytestmark = pytest.mark.django_db

SENDERS = [
    (
        send_password_reset_email,
        {
            "recipient": "a@example.test",
            "full_name": "Ada Lovelace",
            "reset_url": "https://app.example.test/reset?token=abc",
        },
    ),
    (
        send_email_verification_email,
        {
            "recipient": "a@example.test",
            "full_name": "Ada Lovelace",
            "verification_url": "https://app.example.test/verify?token=abc",
        },
    ),
    (
        send_email_change_verification_email,
        {
            "recipient": "a@example.test",
            "full_name": "Ada Lovelace",
            "verification_url": "https://app.example.test/change?token=abc",
        },
    ),
    (
        send_welcome_email,
        {
            "recipient": "a@example.test",
            "full_name": "Ada Lovelace",
        },
    ),
]


@pytest.mark.parametrize(
    ("sender", "kwargs"),
    SENDERS,
    ids=lambda v: getattr(v, "__name__", ""),
)
def test_every_template_renders_both_parts(sender, kwargs):
    sender(**kwargs)

    message = mail.outbox[-1]

    assert message.subject
    assert message.body.strip()

    html = message.alternatives[0][0]

    assert html.strip()
    # An unresolved variable renders as an empty string, so a leftover
    # template tag means the block never ran.
    assert "{{" not in html
    assert "{%" not in html


@pytest.mark.parametrize(
    ("sender", "kwargs"),
    SENDERS,
    ids=lambda v: getattr(v, "__name__", ""),
)
def test_no_project_specific_branding_remains(sender, kwargs):
    """
    The templates were French and hardcoded one organisation's name.
    Branding must come from settings so a fork changes APP_NAME only.
    """

    sender(**kwargs)

    message = mail.outbox[-1]
    content = message.body + message.alternatives[0][0]

    for token in ("L.W.N.F", "LWNF", "Bonjour", "Cordialement"):
        assert token not in content


@override_settings(EMAIL_SITE_NAME="Acme Corp")
def test_site_name_comes_from_settings():
    send_welcome_email(
        recipient="a@example.test",
        full_name="Ada Lovelace",
    )

    assert "Acme Corp" in mail.outbox[-1].body


@override_settings(PASSWORD_RESET_TOKEN_LIFETIME_MINUTES=45)
def test_expiry_is_not_hardcoded_in_the_template():
    """
    The old copy said "24 heures" regardless of configuration, so the
    email could contradict the actual token lifetime.
    """

    send_password_reset_email(
        recipient="a@example.test",
        full_name="Ada Lovelace",
        reset_url="https://app.example.test/reset?token=abc",
    )

    assert "45 minutes" in mail.outbox[-1].body


def test_recipient_is_not_written_to_disk(tmp_path, monkeypatch):
    """
    The task used to append recipient addresses to scratch files in the
    working directory - unbounded growth, and personal data at rest.
    """

    monkeypatch.chdir(tmp_path)

    send_welcome_email(
        recipient="a@example.test",
        full_name="Ada Lovelace",
    )

    assert not list(tmp_path.iterdir())
