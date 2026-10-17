"""
Release the Profile and Address models to the profiles app.

State-only: the tables `users_profile` and `users_address` are left
exactly as they are, and `profiles.0001_initial` re-declares the models
against those same table names. Only Django's record of which app owns
them changes.

Splitting the move across two migrations is what makes it safe - each
app's migration state stays internally consistent at every point, and
`profiles.0001_initial` depends on this one so the order is forced.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_address_unique_default_address_per_user"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                # Constraints and indexes are dropped from state first:
                # a DeleteModel while they are still attached leaves the
                # state inconsistent.
                migrations.RemoveConstraint(
                    model_name="address",
                    name="unique_default_address_per_user",
                ),
                migrations.RemoveConstraint(
                    model_name="address",
                    name="unique_address_type_per_user",
                ),
                migrations.RemoveIndex(
                    model_name="address",
                    name="address_user_idx",
                ),
                migrations.RemoveIndex(
                    model_name="address",
                    name="address_country_idx",
                ),
                migrations.RemoveIndex(
                    model_name="address",
                    name="address_city_idx",
                ),
                migrations.RemoveIndex(
                    model_name="address",
                    name="address_default_idx",
                ),
                migrations.DeleteModel(name="Address"),
                migrations.DeleteModel(name="Profile"),
            ],
        ),
    ]
