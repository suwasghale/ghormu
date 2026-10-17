"""
Adopt the Profile and Address models into the profiles app.

These models moved out of `users`. Both halves are state-only:
`users.0012` drops them from that app's migration state and this
migration re-declares them here with `db_table` pinned to the original
names.

Nothing happens to the database. No table is created, renamed or
copied - only Django's record of which app owns them changes. That is
why `database_operations` is empty on both sides, and why the operation
list is wrapped rather than run directly.
"""

import django.db.models.deletion
import django_countries.fields
import phonenumber_field.modelfields
import timezone_field.fields
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        # Forces the users side of the move to run first.
        ("users", "0012_move_profile_and_address_out"),
    ]

    state_operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('address_type', models.CharField(choices=[('home', 'Home'), ('office', 'Office'), ('billing', 'Billing'), ('shipping', 'Shipping'), ('other', 'Other')], default='home', max_length=20, verbose_name='Address type')),
                ('label', models.CharField(blank=True, help_text="Optional custom label such as Parents' Home.", max_length=100, verbose_name='Label')),
                ('street_address', models.CharField(max_length=255, verbose_name='Street address')),
                ('address_line_2', models.CharField(blank=True, max_length=255, verbose_name='Address line 2')),
                ('city', models.CharField(max_length=100, verbose_name='City')),
                ('state', models.CharField(blank=True, max_length=100, verbose_name='State / Province')),
                ('postal_code', models.CharField(blank=True, max_length=20, verbose_name='Postal code')),
                ('country', django_countries.fields.CountryField(max_length=2, verbose_name='Country')),
                ('is_default', models.BooleanField(default=False, verbose_name='Default address')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated at')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='addresses', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Address',
                'verbose_name_plural': 'Addresses',
                'db_table': 'users_address',
                'ordering': ('-is_default', '-created_at'),
                'indexes': [models.Index(fields=['user'], name='address_user_idx'), models.Index(fields=['country'], name='address_country_idx'), models.Index(fields=['city'], name='address_city_idx'), models.Index(fields=['is_default'], name='address_default_idx')],
                'constraints': [models.UniqueConstraint(fields=('user', 'address_type'), name='unique_address_type_per_user'), models.UniqueConstraint(condition=models.Q(('is_default', True)), fields=('user',), name='unique_default_address_per_user')],
            },
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for the profile.', primary_key=True, serialize=False, verbose_name='ID')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='Avatar')),
                ('gender', models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other'), ('prefer_not_to_say', 'Prefer not to say')], max_length=20, verbose_name='Gender')),
                ('date_of_birth', models.DateField(blank=True, null=True, verbose_name='Date of birth')),
                ('nationality', django_countries.fields.CountryField(blank=True, max_length=2, null=True, verbose_name='Nationality')),
                ('phone_number', phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, region='FR')),
                ('biography', models.TextField(blank=True, help_text='Short public biography.', verbose_name='Biography')),
                ('preferred_language', models.CharField(default='fr', max_length=10, verbose_name='Preferred language')),
                ('timezone', timezone_field.fields.TimeZoneField(default='Europe/Paris', verbose_name='Timezone')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated at')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Profile',
                'verbose_name_plural': 'Profiles',
                'db_table': 'users_profile',
                'ordering': ('-created_at',),
                'indexes': [models.Index(fields=['created_at'], name='profile_created_idx'), models.Index(fields=['phone_number'], name='profile_phone_idx')],
            },
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=state_operations,
        ),
    ]
