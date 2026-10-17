"""
Model factories for the test suite.
"""

from __future__ import annotations

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.users.models import User

DEFAULT_PASSWORD = "Str0ng-Testing-Pass!42"


class UserFactory(DjangoModelFactory):
    """
    A verified, active user with a usable password.
    """

    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(
        lambda n: f"user{n}@example.test",
    )

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    is_active = True
    is_verified = True
    is_staff = False

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        if not create:
            return

        obj.set_password(extracted or DEFAULT_PASSWORD)
        obj.save(update_fields=["password"])


class UnverifiedUserFactory(UserFactory):
    is_verified = False


class InactiveUserFactory(UserFactory):
    is_active = False


class DeletedUserFactory(UserFactory):
    is_active = False
    deleted_at = factory.LazyFunction(timezone.now)


class StaffUserFactory(UserFactory):
    is_staff = True


class SuperUserFactory(UserFactory):
    is_staff = True
    is_superuser = True
