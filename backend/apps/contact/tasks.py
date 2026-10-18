"""
Notify staff of a new contact message.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import mail_managers

logger = logging.getLogger(__name__)


@shared_task(
    name="contact.tasks.notify_staff",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(OSError,),
)
def notify_staff(message_id: str) -> None:
    """
    Email the managers (``ADMIN_EMAIL``) that a message arrived.

    The email carries the message so it can be read on a phone, plus a link
    to the admin where it is marked handled. A failure is retried and then
    logged; the message itself is already safe in the database.
    """

    from apps.contact.models import ContactMessage

    message = ContactMessage.objects.filter(pk=message_id).first()

    if message is None:
        return

    contact = " · ".join(value for value in (message.email, message.phone) if value)

    body = (
        f"{message.get_topic_display()}\n"
        f"From: {message.name} ({contact})\n"
        f"Language: {message.get_language_display()}\n\n"
        f"{message.message}\n\n"
        f"{settings.FRONTEND_URL}/admin/messages/{message.pk}"
    )

    mail_managers(subject=f"New message: {message.get_topic_display()}", message=body)

    logger.info("contact message %s sent to managers", message.pk)
