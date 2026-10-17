from django.db import models


class VisibilityChoices(models.TextChoices):
    PRIVATE = "private", "Private"
    INTERNAL = "internal", "Internal"
    PUBLIC = "public", "Public"
