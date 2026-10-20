"""
Content shown on the public website: news and notices, events,
development projects and the digital archive.

Translatable text is stored as paired columns (``title_ne`` / ``title_en``),
read through ``core.i18n.localized`` so an English visitor sees the Nepali
text rather than nothing when a translation is missing. Nepali is required;
English is optional.

Images are URLs, not files: the admin uploads through
``/api/v1/admin/media/`` and writes the returned address here, so every
model shares one upload path.
"""

from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.public_content.choices import (
    ArchiveKindChoices,
    EventCategoryChoices,
    MapPlaceCategoryChoices,
    PostKindChoices,
    ProjectStageChoices,
)
from core.content import plain_text, sanitize_html, strip_html
from core.models import PublishableModel, TimeStampedModel, UUIDModel

#: Post slugs that would collide with fixed pages under /updates/.
RESERVED_POST_SLUGS = frozenset({"announcements", "development"})


def validate_media_url(value: str) -> None:
    """
    An uploaded image's address: absolute https, or the site's own
    ``/api/media/`` path that development uploads come back as.
    """

    if not value:
        return

    if value.startswith(("https://", "http://", "/api/media/")):
        return

    raise ValidationError("Enter an https:// address or an uploaded image path.")


def media_url_field(verbose_name: str = "Image") -> models.CharField:
    return models.CharField(
        max_length=500,
        blank=True,
        validators=[validate_media_url],
        verbose_name=verbose_name,
    )


def unique_slug(instance: models.Model, *sources: str, fallback: str) -> str:
    """
    A slug from the first source that has Latin letters, made unique.

    Nepali titles slugify to nothing, so an untranslated row falls back to
    ``<fallback>-<random>``; an editor can still set a readable one.
    """

    base = next(
        (slugify(source)[:70] for source in sources if slugify(source or "")), ""
    )
    base = base or f"{fallback}-{uuid.uuid4().hex[:8]}"

    model = type(instance)
    candidate = base
    suffix = 2

    while (
        model._default_manager.filter(slug=candidate).exclude(pk=instance.pk).exists()
    ):
        candidate = f"{base}-{suffix}"
        suffix += 1

    return candidate


class ContentModel(UUIDModel, TimeStampedModel, PublishableModel):
    """
    Common columns: identity, timestamps and the publication lifecycle.
    """

    class Meta:
        abstract = True


# =============================================================================
# News and announcements
# =============================================================================


class Post(ContentModel):
    kind = models.CharField(
        max_length=20,
        choices=PostKindChoices.choices,
        default=PostKindChoices.NEWS,
        db_index=True,
        verbose_name="Kind",
    )

    slug = models.SlugField(
        max_length=80,
        unique=True,
        blank=True,
        help_text=(
            "Part of the address: /updates/<slug>. "
            "Filled in from the English title when left empty."
        ),
        verbose_name="Slug",
    )

    title_ne = models.CharField(max_length=200, verbose_name="Title (Nepali)")
    title_en = models.CharField(
        max_length=200, blank=True, verbose_name="Title (English)"
    )

    summary_ne = models.TextField(
        max_length=400, blank=True, verbose_name="Summary (Nepali)"
    )
    summary_en = models.TextField(
        max_length=400, blank=True, verbose_name="Summary (English)"
    )

    body_ne = models.TextField(blank=True, verbose_name="Body (Nepali)")
    body_en = models.TextField(blank=True, verbose_name="Body (English)")

    image_url = media_url_field()

    attachment_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="A PDF or document to download, such as meeting minutes.",
        verbose_name="Attachment",
    )

    is_pinned = models.BooleanField(
        default=False,
        help_text="Pinned posts stay at the top of their list.",
        verbose_name="Pinned",
    )

    class Meta:
        ordering = ("-is_pinned", "-published_at")
        verbose_name = "post"
        verbose_name_plural = "posts"

    def __str__(self) -> str:
        return self.title_en or self.title_ne

    @property
    def detail_path(self) -> str:
        return f"/updates/{self.slug}"

    def clean(self) -> None:
        super().clean()

        if self.slug in RESERVED_POST_SLUGS:
            raise ValidationError(
                {
                    "slug": (
                        "This address is used by another page. Choose a different slug."
                    )
                }
            )

    def save(self, *args, **kwargs):
        # Stored clean, so no consumer can serve a script an editor pasted.
        self.body_ne = sanitize_html(self.body_ne)
        self.body_en = sanitize_html(self.body_en)
        self.summary_ne = strip_html(self.summary_ne)
        self.summary_en = strip_html(self.summary_en)

        if not self.slug or self.slug in RESERVED_POST_SLUGS:
            self.slug = unique_slug(self, self.slug, self.title_en, fallback="post")

        super().save(*args, **kwargs)


# =============================================================================
# Events
# =============================================================================


class Event(ContentModel):
    category = models.CharField(
        max_length=20,
        choices=EventCategoryChoices.choices,
        default=EventCategoryChoices.COMMUNITY,
        db_index=True,
        verbose_name="Category",
    )

    title_ne = models.CharField(max_length=200, verbose_name="Title (Nepali)")
    title_en = models.CharField(
        max_length=200, blank=True, verbose_name="Title (English)"
    )

    description_ne = models.TextField(
        max_length=2000, blank=True, verbose_name="Description (Nepali)"
    )
    description_en = models.TextField(
        max_length=2000, blank=True, verbose_name="Description (English)"
    )

    location_ne = models.CharField(
        max_length=200, blank=True, verbose_name="Place (Nepali)"
    )
    location_en = models.CharField(
        max_length=200, blank=True, verbose_name="Place (English)"
    )

    starts_on = models.DateField(db_index=True, verbose_name="Starts on")
    ends_on = models.DateField(
        null=True,
        blank=True,
        help_text="Leave empty for a one-day event.",
        verbose_name="Ends on",
    )

    image_url = media_url_field()

    class Meta:
        ordering = ("starts_on",)
        verbose_name = "event"
        verbose_name_plural = "events"

    def __str__(self) -> str:
        return self.title_en or self.title_ne

    @property
    def last_day(self):
        return self.ends_on or self.starts_on

    def clean(self) -> None:
        super().clean()

        if self.ends_on and self.starts_on and self.ends_on < self.starts_on:
            raise ValidationError({"ends_on": "An event cannot end before it starts."})

    def save(self, *args, **kwargs):
        self.description_ne = plain_text(self.description_ne)
        self.description_en = plain_text(self.description_en)
        super().save(*args, **kwargs)


# =============================================================================
# Development projects
# =============================================================================


class Project(ContentModel):
    stage = models.CharField(
        max_length=20,
        choices=ProjectStageChoices.choices,
        default=ProjectStageChoices.PLANNED,
        db_index=True,
        verbose_name="Stage",
    )

    title_ne = models.CharField(max_length=200, verbose_name="Title (Nepali)")
    title_en = models.CharField(
        max_length=200, blank=True, verbose_name="Title (English)"
    )

    summary_ne = models.TextField(
        max_length=2000, blank=True, verbose_name="Summary (Nepali)"
    )
    summary_en = models.TextField(
        max_length=2000, blank=True, verbose_name="Summary (English)"
    )

    funding_ne = models.CharField(
        max_length=200,
        blank=True,
        help_text="Who pays for it, e.g. the rural municipality or the community.",
        verbose_name="Funding (Nepali)",
    )
    funding_en = models.CharField(
        max_length=200, blank=True, verbose_name="Funding (English)"
    )

    budget_npr = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        help_text="Total budget in rupees. Leave empty if not public.",
        verbose_name="Budget (NPR)",
    )

    progress = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percent complete, 0–100.",
        verbose_name="Progress",
    )

    started_on = models.DateField(null=True, blank=True, verbose_name="Started on")
    completed_on = models.DateField(null=True, blank=True, verbose_name="Completed on")

    image_url = media_url_field()

    class Meta:
        ordering = ("stage", "-started_on")
        verbose_name = "project"
        verbose_name_plural = "projects"

    def __str__(self) -> str:
        return self.title_en or self.title_ne

    def save(self, *args, **kwargs):
        self.summary_ne = plain_text(self.summary_ne)
        self.summary_en = plain_text(self.summary_en)

        if self.stage == ProjectStageChoices.COMPLETED and self.progress is None:
            self.progress = 100

        super().save(*args, **kwargs)


# =============================================================================
# Digital archive
# =============================================================================


class ArchiveItem(ContentModel):
    """
    One photograph, document, map or satellite view.

    A date is often only approximately known, so it is stored twice: a
    ``year`` to sort and group by decade, and a free-text label to show
    ("around 2045 BS", "1990s").

    People appear in old photographs who never agreed to be on a website.
    ``consent_confirmed`` must be ticked before an item can be published.
    """

    kind = models.CharField(
        max_length=20,
        choices=ArchiveKindChoices.choices,
        default=ArchiveKindChoices.PHOTO,
        db_index=True,
        verbose_name="Kind",
    )

    slug = models.SlugField(
        max_length=80,
        unique=True,
        blank=True,
        help_text="Part of the address: /about/archive/<slug>.",
        verbose_name="Slug",
    )

    title_ne = models.CharField(max_length=200, verbose_name="Title (Nepali)")
    title_en = models.CharField(
        max_length=200, blank=True, verbose_name="Title (English)"
    )

    description_ne = models.TextField(
        max_length=4000, blank=True, verbose_name="Story (Nepali)"
    )
    description_en = models.TextField(
        max_length=4000, blank=True, verbose_name="Story (English)"
    )

    year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1800), MaxValueValidator(2200)],
        help_text="Gregorian year, exact or best guess. Used for sorting and decades.",
        verbose_name="Year (AD)",
    )

    date_label_ne = models.CharField(
        max_length=100,
        blank=True,
        help_text='How to show the date, e.g. "करिब २०४५ साल".',
        verbose_name="Date shown (Nepali)",
    )
    date_label_en = models.CharField(
        max_length=100, blank=True, verbose_name="Date shown (English)"
    )

    place_ne = models.CharField(
        max_length=200, blank=True, verbose_name="Place (Nepali)"
    )
    place_en = models.CharField(
        max_length=200, blank=True, verbose_name="Place (English)"
    )

    credit = models.CharField(
        max_length=300,
        blank=True,
        help_text=(
            "Who gave or took it, or the required credit line, e.g. "
            '"Imagery: Google, Maxar Technologies".'
        ),
        verbose_name="Credit",
    )

    image_url = media_url_field()

    consent_confirmed = models.BooleanField(
        default=False,
        help_text="The owner, and anyone recognisable in it, agreed to publication.",
        verbose_name="Permission confirmed",
    )

    class Meta:
        ordering = ("year", "created_at")
        verbose_name = "archive item"
        verbose_name_plural = "archive items"

    def __str__(self) -> str:
        return self.title_en or self.title_ne

    @property
    def detail_path(self) -> str:
        return f"/about/archive/{self.slug}"

    def clean(self) -> None:
        super().clean()

        errors = {}

        if self.status == "published" and not self.consent_confirmed:
            errors["consent_confirmed"] = "Confirm permission before publishing."

        if self.kind == ArchiveKindChoices.SATELLITE and not self.credit:
            errors["credit"] = "Satellite images must carry their credit line."

        if self.kind == ArchiveKindChoices.SATELLITE and not self.year:
            errors["year"] = "Satellite images need the year they were captured."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.description_ne = plain_text(self.description_ne)
        self.description_en = plain_text(self.description_en)

        if not self.slug:
            self.slug = unique_slug(self, self.title_en, fallback="item")

        super().save(*args, **kwargs)


# =============================================================================
# Village map
# =============================================================================

#: A box of about 10 km around the village centre. A point outside it is
#: almost always a typing mistake or latitude and longitude swapped.
VILLAGE_BOUNDS = {"latitude": (27.97, 28.06), "longitude": (85.20, 85.31)}


class MapPlace(ContentModel):
    """
    A public place pinned on the 3D village map: a gompa, the school, a
    water tap, a viewpoint. Never a private home.

    Coordinates are WGS84 decimal degrees, as Google Maps copies them;
    six decimals is about 10 cm, finer than any phone's GPS.
    """

    category = models.CharField(
        max_length=20,
        choices=MapPlaceCategoryChoices.choices,
        default=MapPlaceCategoryChoices.OTHER,
        db_index=True,
        verbose_name="Category",
    )

    name_ne = models.CharField(max_length=120, verbose_name="Name (Nepali)")
    name_en = models.CharField(
        max_length=120, blank=True, verbose_name="Name (English)"
    )

    description_ne = models.TextField(
        max_length=600, blank=True, verbose_name="Description (Nepali)"
    )
    description_en = models.TextField(
        max_length=600, blank=True, verbose_name="Description (English)"
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="The first number Google Maps copies, e.g. 28.010270.",
        verbose_name="Latitude",
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="The second number, e.g. 85.254317.",
        verbose_name="Longitude",
    )

    image_url = media_url_field()

    sort_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Lower numbers come first in the list beside the map.",
        verbose_name="Order",
    )

    class Meta:
        ordering = ("sort_order", "name_ne")
        verbose_name = "map place"
        verbose_name_plural = "map places"

    def __str__(self) -> str:
        return self.name_en or self.name_ne

    def clean(self) -> None:
        super().clean()

        errors = {}

        for axis in ("latitude", "longitude"):
            value = getattr(self, axis)
            low, high = VILLAGE_BOUNDS[axis]

            if value is not None and not low <= value <= high:
                errors[axis] = (
                    f"This is not near Ghormu ({low}–{high}). "
                    "Check the number, and that latitude and longitude are not swapped."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.description_ne = plain_text(self.description_ne)
        self.description_en = plain_text(self.description_en)
        super().save(*args, **kwargs)
