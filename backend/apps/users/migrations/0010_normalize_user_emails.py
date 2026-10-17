"""
Normalize stored email addresses to lowercase.

Lookups moved from `email__iexact` to an exact match so they can use the
unique index. Any address stored with mixed case would stop resolving,
so existing rows are normalized here.
"""

from django.db import migrations
from django.db.models.functions import Lower


def normalize_emails(apps, schema_editor):
    User = apps.get_model("users", "User")

    mixed_case = (
        User.objects
        .exclude(email=Lower("email"))
        .only("id", "email")
    )

    # A case-insensitive collision means two accounts exist that will
    # both normalize to the same address. Lowercasing them would violate
    # the unique constraint, so those are left alone and reported: the
    # merge is a business decision, not something a migration should
    # make silently.
    seen: dict[str, object] = {}
    conflicts: list[str] = []
    updates = []

    for user in mixed_case.iterator():
        lowered = user.email.strip().lower()

        clashes = (
            User.objects
            .annotate(lowered=Lower("email"))
            .filter(lowered=lowered)
            .exclude(pk=user.pk)
            .exists()
        )

        if clashes or lowered in seen:
            conflicts.append(user.email)
            continue

        seen[lowered] = user.pk
        user.email = lowered
        updates.append(user)

    if updates:
        User.objects.bulk_update(updates, ["email"], batch_size=500)

    if conflicts:
        print(
            "\n  Skipped {count} address(es) that collide "
            "case-insensitively with another account. Resolve these "
            "manually, they can no longer sign in:\n    {rows}".format(
                count=len(conflicts),
                rows="\n    ".join(conflicts),
            )
        )


def noop(apps, schema_editor):
    """
    Case cannot be restored, and lowercase addresses remain valid.
    """


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0009_alter_user_email"),
    ]

    operations = [
        migrations.RunPython(
            normalize_emails,
            noop,
        ),
    ]
