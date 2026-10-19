"""
Messages sent through the website's contact and feedback forms.

Kept apart from public content because it holds personal data: names,
emails and phone numbers that only staff may read, never the public API.
"""

from __future__ import annotations

from django.db import models

from core.choices import LanguageChoices
from core.models import TimeStampedModel, UUIDModel


class ContactTopicChoices(models.TextChoices):
    GENERAL = "general", "General question"
    FEEDBACK = "feedback", "Feedback or suggestion"
    CORRECTION = "correction", "Correction to the website"
    ARCHIVE = "archive", "Photos, stories or documents to share"
    TRAVEL = "travel", "Visiting Ghormu"
    SUPPORT = "support", "Supporting Ghormu"


class ContactMessage(UUIDModel, TimeStampedModel):
    name = models.CharField(max_length=120, verbose_name="Name")
    email = models.EmailField(blank=True, verbose_name="Email")
    phone = models.CharField(max_length=40, blank=True, verbose_name="Phone")

    topic = models.CharField(
        max_length=20,
        choices=ContactTopicChoices.choices,
        default=ContactTopicChoices.GENERAL,
        db_index=True,
        verbose_name="Topic",
    )

    message = models.TextField(max_length=5000, verbose_name="Message")

    language = models.CharField(
        max_length=10,
        choices=LanguageChoices.choices,
        default=LanguageChoices.NE,
        help_text="The language the sender wrote from, to reply in it.",
        verbose_name="Language",
    )

    handled = models.BooleanField(default=False, db_index=True, verbose_name="Handled")

    staff_note = models.TextField(
        blank=True,
        help_text="Visible to staff only.",
        verbose_name="Staff note",
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "message"
        verbose_name_plural = "messages"

    def __str__(self) -> str:
        return f"{self.name} — {self.get_topic_display()}"
