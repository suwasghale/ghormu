"""
Custom user model.

Email is the login identifier and the primary key is a UUID. The model
holds authentication and identity data only; profile data, addresses and
social accounts live in their own models, and registration, password and
token workflows live in services.
"""

from __future__ import annotations

import uuid

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom authentication model.

    Email is used as the unique login identifier instead of username.

    This model intentionally contains only authentication and identity
    information. Additional user-related data belongs in dedicated models
    such as Profile and Address.
    """

    # -------------------------------------------------------------------------
    # Identity
    # -------------------------------------------------------------------------

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_("ID"),
        help_text=_("Unique identifier for the user."),
    )

    # -------------------------------------------------------------------------
    # Authentication
    # -------------------------------------------------------------------------

    # `unique=True` already creates a btree index; `db_index=True`
    # alongside it produced a second, redundant index that had to be
    # maintained on every write.
    #
    # Addresses are normalized to lowercase before they are stored (see
    # UserManager and the serializers), which lets lookups use plain
    # equality and hit this index. Case-insensitive matching via
    # `iexact` compiles to UPPER(email) = UPPER(...) and cannot use it
    # at all, forcing a sequential scan on the login path.
    email = models.EmailField(
        unique=True,
        max_length=254,
        verbose_name=_("Email address"),
        help_text=_("Unique email address used for authentication."),
    )

    # -------------------------------------------------------------------------
    # Personal Information
    # -------------------------------------------------------------------------

    first_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name=_("First name"),
    )

    last_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name=_("Last name"),
    )

    # -------------------------------------------------------------------------
    # Account Status
    # -------------------------------------------------------------------------

    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Designates whether this account is active."),
    )

    is_staff = models.BooleanField(
        default=False,
        verbose_name=_("Staff status"),
        help_text=_("Designates whether the user can access the admin site."),
    )

    is_verified = models.BooleanField(
        default=False,
        verbose_name=_("Verified"),
        help_text=_("Indicates whether the user's email address has been verified."),
    )

    # -------------------------------------------------------------------------
    # Activity
    # -------------------------------------------------------------------------

    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Last seen"),
    )

    # -------------------------------------------------------------------------
    # Timestamps
    # -------------------------------------------------------------------------

    # Business meaning: "When did this person sign up?"
    date_joined = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Date joined"),
    )

    # Database record creation timestamp.
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created at"),
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated at"),
    )

    deleted_at = models.DateTimeField(
        null=True, blank=True, verbose_name=_("Deleted At")
    )

    # Set once the grace period after deletion has passed and the
    # account's personal data has been removed. See
    # services/auth/anonymize_account.py.
    anonymized_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Anonymized at"),
    )

    # -------------------------------------------------------------------------
    # Authentication Configuration
    # -------------------------------------------------------------------------

    objects = UserManager()

    EMAIL_FIELD = "email"

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS: list[str] = []

    # -------------------------------------------------------------------------
    # Computed Properties
    # -------------------------------------------------------------------------

    @property
    def full_name(self) -> str:
        """
        Return the user's full name.

        Returns:
            str: First name and last name combined, with extra whitespace removed.
        """
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def short_name(self) -> str:
        """
        Return the preferred short display name.

        Priority:
            1. First name
            2. Email address
        """
        return self.first_name or self.email

    # -------------------------------------------------------------------------
    # Instance Methods
    # -------------------------------------------------------------------------

    def clean(self) -> None:
        """
        Normalize and validate model data.

        Automatically called by `full_clean()`, which the serializers
        and the admin invoke. It is deliberately not called from
        `save()`.
        """

        super().clean()

        if self.email:
            self.email = self.__class__.objects.normalize_email(
                self.email,
            ).lower()

    def save(self, *args, **kwargs) -> None:
        """
        Save the user instance.

        Normalizes the email so no code path can persist a differently
        cased duplicate, but does not run `full_clean()`.

        Calling `full_clean()` here meant every write - including
        `save(update_fields=["last_seen"])` on the request path - ran
        every field validator plus an extra SELECT to re-check email
        uniqueness, and raised Django's ValidationError from deep in the
        service layer where callers expect a domain exception. Input
        validation belongs to the serializers.
        """

        if self.email:
            self.email = self.email.strip().lower()

        super().save(*args, **kwargs)

    def email_user(
        self,
        subject: str,
        message: str,
        from_email: str | None = None,
        **kwargs,
    ) -> None:
        """
        Send an email to this user.

        This mirrors Django's default User implementation,
        making the model compatible with Django's ecosystem.
        """

        from django.core.mail import send_mail

        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[self.email],
            **kwargs,
        )

    def __str__(self) -> str:
        """
        Human-readable representation.
        """

        return self.full_name or self.email

    # -------------------------------------------------------------------------
    # Model Metadata
    # -------------------------------------------------------------------------

    class Meta:
        """
        Model metadata.
        """

        verbose_name = _("User")
        verbose_name_plural = _("Users")

        ordering = ("-created_at",)

        indexes = [
            models.Index(
                fields=["is_active"],
                name="user_active_idx",
            ),
            models.Index(
                fields=["is_verified"],
                name="user_verified_idx",
            ),
            models.Index(
                fields=["created_at"],
                name="user_created_idx",
            ),
            models.Index(
                fields=["last_seen"],
                name="user_last_seen_idx",
            ),
        ]
