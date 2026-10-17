"""
Abstract base models shared by every content app.

Three concerns, kept separate so a model takes only what it needs:

``UUIDModel``          surrogate key that is safe to expose
``TimeStampedModel``   created/updated bookkeeping
``PublishableModel``   the draft → published → archived lifecycle

Public content is read by anonymous visitors, so "is this row visible?"
is a security question, not a presentation one. It lives on the model and
is enforced by a manager, not left to each caller to remember.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone

from core.choices import PublicationStatusChoices


class UUIDModel(models.Model):
    """
    Primary key that reveals nothing about row counts or insert order.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID",
    )

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """
    Creation and modification timestamps.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Created at",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated at",
    )

    class Meta:
        abstract = True


class PublishedQuerySet(models.QuerySet):
    """
    Queryset with the visibility rule attached.
    """

    def published(self):
        """
        Rows the public API is allowed to return.

        A future ``published_at`` keeps a row invisible, which is what
        makes scheduling work without a cron job: the row is simply not
        yet visible when the clock passes it.
        """

        return self.filter(
            status=PublicationStatusChoices.PUBLISHED,
            published_at__lte=timezone.now(),
        )

    def drafts(self):
        return self.filter(status=PublicationStatusChoices.DRAFT)

    def archived(self):
        return self.filter(status=PublicationStatusChoices.ARCHIVED)


class PublishableModel(models.Model):
    """
    Draft → published → archived, with an effective-from timestamp.
    """

    status = models.CharField(
        max_length=20,
        choices=PublicationStatusChoices.choices,
        default=PublicationStatusChoices.DRAFT,
        db_index=True,
        verbose_name="Status",
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text=(
            "When this becomes publicly visible. Leave empty to publish "
            "as soon as the status is set to published."
        ),
        verbose_name="Published at",
    )

    objects = PublishedQuerySet.as_manager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Make the ``published_at`` help text true.

        It has always said "leave empty to publish as soon as the status
        is set to published", and nothing implemented that. Only the
        admin's bulk "Publish selected" action filled the field in; the
        change form did not, and neither did the shell or the import
        commands. Meanwhile ``published()`` filters on
        ``published_at__lte=now``, which excludes NULL.

        So the documented workflow — set status to Published, leave the
        date empty, save — stored a row the admin lists as published and
        the site never shows. No error, nothing in a log. It is the kind
        of thing that gets reported as "the website is broken" a week
        later, and it was found by tripping over it while writing test
        fixtures.

        Setting it here rather than in ``save_model`` covers every way a
        row can be published: the change form, the DRF admin serializers,
        a management command, a data migration, the shell.

        Only ever fills a blank. An explicit future date still schedules,
        and re-publishing something archived keeps its original date
        rather than back-dating the history.
        """

        if (
            self.status == PublicationStatusChoices.PUBLISHED
            and self.published_at is None
        ):
            self.published_at = timezone.now()

            # A partial save only writes the columns it is given, so
            # without this the timestamp is set on the instance and
            # silently dropped on the way to the database — which is the
            # original bug wearing a different hat.
            update_fields = kwargs.get("update_fields")

            if update_fields is not None:
                kwargs["update_fields"] = {*update_fields, "published_at"}

        super().save(*args, **kwargs)

    @property
    def is_public(self) -> bool:
        """
        Mirror of ``PublishedQuerySet.published`` for a single instance.
        """

        return (
            self.status == PublicationStatusChoices.PUBLISHED
            and self.published_at is not None
            and self.published_at <= timezone.now()
        )
