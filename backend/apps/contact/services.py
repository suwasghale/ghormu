"""
Accepting a message from the website.
"""

from __future__ import annotations

from django.db import transaction

from apps.contact.models import ContactMessage
from core.content import plain_text


def submit_message(
    *, name: str, email: str, phone: str, topic: str, message: str, language: str
) -> ContactMessage:
    """
    Store the message, then tell staff once it is committed.

    Stored as plain text: it is shown in the admin and sent by email, and
    neither should ever render markup a stranger typed.
    """

    record = ContactMessage.objects.create(
        name=" ".join(name.split()),
        email=email.strip().lower(),
        phone=phone.strip(),
        topic=topic,
        message=plain_text(message),
        language=language,
    )

    from apps.contact.tasks import notify_staff

    transaction.on_commit(lambda: notify_staff.delay(str(record.pk)))

    return record
