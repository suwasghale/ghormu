from django.db import models


class LanguageChoices(models.TextChoices):
    ENGLISH = "en", "English"
    FRENCH = "fr", "French"
