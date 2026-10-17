"""
Enforce one default address per user in the database.

The invariant previously lived only in `Address.clean()`, so it depended
on `full_clean()` being called and could be violated by two concurrent
requests. Existing rows may therefore already breach it, and adding the
constraint to such a table fails - so duplicates are resolved first.
"""

from django.db import migrations, models


def collapse_duplicate_defaults(apps, schema_editor):
    """
    Leave exactly one default address per user.

    The most recently created default wins, which matches what the user
    last asked for.
    """

    Address = apps.get_model("users", "Address")

    user_ids = (
        Address.objects
        .filter(is_default=True)
        .values_list("user_id", flat=True)
        .distinct()
    )

    for user_id in user_ids:
        defaults = list(
            Address.objects
            .filter(user_id=user_id, is_default=True)
            .order_by("-created_at", "-id")
            .values_list("id", flat=True)
        )

        if len(defaults) <= 1:
            continue

        Address.objects.filter(id__in=defaults[1:]).update(
            is_default=False,
        )


def noop(apps, schema_editor):
    """
    Nothing to undo: the surviving default is still valid.
    """


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0010_normalize_user_emails"),
    ]

    operations = [
        migrations.RunPython(
            collapse_duplicate_defaults,
            noop,
        ),
        migrations.AddConstraint(
            model_name="address",
            constraint=models.UniqueConstraint(
                condition=models.Q(("is_default", True)),
                fields=("user",),
                name="unique_default_address_per_user",
            ),
        ),
    ]
