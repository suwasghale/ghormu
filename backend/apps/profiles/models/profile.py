"""
Profile model.

Stores personal, contact, preference, and public profile information
that should not live inside the authentication User model.
"""

from __future__ import annotations

import uuid
from datetime import date

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django_countries.fields import CountryField
from phonenumber_field.modelfields import PhoneNumberField
from timezone_field import TimeZoneField

from apps.users.choices import GenderChoices, LanguageChoices
from apps.users.models.user import User


class Profile(models.Model):
    """
    Extended profile information for a user.

    Authentication-related fields belong to User.

    Personal, public, and preference-related fields belong here.
    """

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID",
        help_text="Unique identifier for the profile.",
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name="User",
    )

    # ------------------------------------------------------------------
    # Personal Information
    # ------------------------------------------------------------------

    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
        verbose_name="Avatar",
    )

    gender = models.CharField(
        max_length=20,
        choices=GenderChoices.choices,
        blank=True,
        verbose_name="Gender",
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date of birth",
    )

    nationality = CountryField(
        blank=True,
        null=True,
        verbose_name="Nationality",
    )

    # ------------------------------------------------------------------
    # Contact Information
    # ------------------------------------------------------------------

    # No region here: numbers without a country code are parsed with
    # PHONENUMBER_DEFAULT_REGION, and rejected when it is unset, so the
    # stored value is always unambiguous.
    phone_number = PhoneNumberField(
        blank=True,
    )

    # ------------------------------------------------------------------
    # Public Information
    # ------------------------------------------------------------------

    biography = models.TextField(
        blank=True,
        verbose_name="Biography",
        help_text="Short public biography.",
    )

    # ------------------------------------------------------------------
    # Preferences
    # ------------------------------------------------------------------

    # The language default matches core.i18n.DEFAULT_LANGUAGE (the site is
    # Nepali first); the timezone default matches TIME_ZONE in config/settings.
    preferred_language = models.CharField(
        max_length=10,
        choices=LanguageChoices.choices,
        default=LanguageChoices.NE,
        verbose_name="Preferred language",
    )

    timezone = TimeZoneField(
        default="UTC",
        verbose_name="Timezone",
    )

    # ------------------------------------------------------------------
    # Audit Fields
    # ------------------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created at",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated at",
    )

    # ------------------------------------------------------------------
    # Computed Properties
    # ------------------------------------------------------------------

    @property
    def age(self) -> int | None:
        """
        Calculate user's age from date_of_birth.
        """
        if not self.date_of_birth:
            return None

        today = date.today()

        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (
                    self.date_of_birth.month,
                    self.date_of_birth.day,
                )
            )
        )

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def clean(self) -> None:
        """
        Model-level validation.
        """

        super().clean()

        if self.date_of_birth and self.date_of_birth > timezone.now().date():
            raise ValidationError(
                {"date_of_birth": ("Date of birth cannot be in the future.")}
            )

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, *args, **kwargs):
        """
        Persist the instance.

        `full_clean()` is deliberately not called here. Running it on
        every write means every `save(update_fields=[...])` re-validates
        every field and re-runs uniqueness queries, on the request path.
        Input validation belongs to the serializers; the database
        constraints remain the backstop.
        """

        return super().save(*args, **kwargs)

    # ------------------------------------------------------------------
    # String Representation
    # ------------------------------------------------------------------

    def __str__(self) -> str:
        return f"Profile: {self.user.email}"

    # ------------------------------------------------------------------
    # Meta
    # ------------------------------------------------------------------

    class Meta:
        # Pinned to the original table. The model moved from the users
        # app to profiles, and a Django app label change would otherwise
        # rename the physical table. Migration 0012/0001 moves only the
        # migration state; the data never moves.
        db_table = "users_profile"

        verbose_name = "Profile"
        verbose_name_plural = "Profiles"

        ordering = ("-created_at",)

        indexes = [
            models.Index(
                fields=["created_at"],
                name="profile_created_idx",
            ),
            models.Index(
                fields=["phone_number"],
                name="profile_phone_idx",
            ),
        ]
