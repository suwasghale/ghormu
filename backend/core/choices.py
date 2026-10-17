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

    French first: it is the primary language of sg-starter.org and the default
    when a request expresses no preference.
    """

    FR = "fr", "Français"
    EN = "en", "English"
