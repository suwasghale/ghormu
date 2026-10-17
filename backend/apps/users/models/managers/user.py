"""
Custom manager for the User model.

The UserManager is responsible ONLY for constructing valid User
instances and persisting them.

It does NOT:

- send emails
- create profiles
- create tokens
- execute business workflows

Those responsibilities belong to the service layer.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth.base_user import BaseUserManager

if TYPE_CHECKING:
    from apps.users.models import User


class UserManager(BaseUserManager["User"]):
    """
    Production-grade manager for the custom User model.
    """

    use_in_migrations = True

    # =========================================================================
    # Internal helpers
    # =========================================================================

    def _create_user(
        self,
        *,
        email: str,
        password: str | None,
        **extra_fields: Any,
    ) -> User:
        """
        Internal helper used by every user creation method.
        """

        if not email:
            raise ValueError("The email address must be provided.")

        email = self.normalize_email(email).lower()

        user = self.model(
            email=email,
            **extra_fields,
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(
            using=self._db,
        )

        return user

    # =========================================================================
    # Public factories
    # =========================================================================

    def create_user(
        self,
        *,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        """
        Create a regular application user.
        """

        extra_fields.setdefault(
            "is_active",
            True,
        )

        extra_fields.setdefault(
            "is_staff",
            False,
        )

        extra_fields.setdefault(
            "is_superuser",
            False,
        )

        extra_fields.setdefault(
            "is_verified",
            False,
        )

        return self._create_user(
            email=email,
            password=password,
            **extra_fields,
        )

    def create_inactive_user(
        self,
        *,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        """
        Create an inactive user.

        Useful for invitation-based registration or
        email verification workflows.
        """

        extra_fields.setdefault(
            "is_active",
            False,
        )

        extra_fields.setdefault(
            "is_staff",
            False,
        )

        extra_fields.setdefault(
            "is_superuser",
            False,
        )

        extra_fields.setdefault(
            "is_verified",
            False,
        )

        return self._create_user(
            email=email,
            password=password,
            **extra_fields,
        )

    def create_staff_user(
        self,
        *,
        email: str,
        password: str,
        **extra_fields: Any,
    ) -> User:
        """
        Create a staff user.
        """

        extra_fields.setdefault(
            "is_active",
            True,
        )

        extra_fields.setdefault(
            "is_staff",
            True,
        )

        extra_fields.setdefault(
            "is_superuser",
            False,
        )

        extra_fields.setdefault(
            "is_verified",
            True,
        )

        return self._create_user(
            email=email,
            password=password,
            **extra_fields,
        )

    def create_superuser(
        self,
        email: str,
        password: str,
        **extra_fields: Any,
    ) -> User:
        """
        Create a Django superuser.
        """

        extra_fields.setdefault(
            "is_active",
            True,
        )

        extra_fields.setdefault(
            "is_staff",
            True,
        )

        extra_fields.setdefault(
            "is_superuser",
            True,
        )

        extra_fields.setdefault(
            "is_verified",
            True,
        )

        if extra_fields["is_staff"] is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields["is_superuser"] is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(
            email=email,
            password=password,
            **extra_fields,
        )
