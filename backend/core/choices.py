"""
Choices shared across apps.
"""

from django.db import models


class PublicationStatusChoices(models.TextChoices):
    """
    Lifecycle of any publicly visible piece of content.
    """

    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class LanguageChoices(models.TextChoices):
    """
    The site's two content languages.

    Nepali first: it is the primary language of ghormu.com and the default
    when a request expresses no preference.
    """

    NE = "ne", "नेपाली"
    EN = "en", "English"
