"""
The first place on the village map: Ghormu Primary School, where Google
Maps places it (plus code 2763+3PW). Editors change or add places in the
admin; this only makes sure the map is not empty on day one.
"""

from decimal import Decimal

from django.db import migrations
from django.utils import timezone

SCHOOL = {
    "category": "school",
    "name_ne": "घोर्मु प्राथमिक विद्यालय",
    "name_en": "Ghormu Primary School",
    "latitude": Decimal("28.010270"),
    "longitude": Decimal("85.254317"),
}


def add_school(apps, schema_editor):
    MapPlace = apps.get_model("public_content", "MapPlace")

    if MapPlace.objects.filter(name_en=SCHOOL["name_en"]).exists():
        return

    MapPlace.objects.create(**SCHOOL, status="published", published_at=timezone.now())


def remove_school(apps, schema_editor):
    MapPlace = apps.get_model("public_content", "MapPlace")
    MapPlace.objects.filter(name_en=SCHOOL["name_en"]).delete()


class Migration(migrations.Migration):
    dependencies = [("public_content", "0002_map_place")]

    operations = [migrations.RunPython(add_school, remove_school)]
