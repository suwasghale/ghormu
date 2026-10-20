"""
Choices for the public website's content.
"""

from django.db import models


class PostKindChoices(models.TextChoices):
    """
    News is reporting; an announcement is a notice people must act on
    (a meeting, a deadline, a road closure). They list separately.
    """

    NEWS = "news", "News"
    ANNOUNCEMENT = "announcement", "Announcement"


class EventCategoryChoices(models.TextChoices):
    FESTIVAL = "festival", "Festival"
    CEREMONY = "ceremony", "Ceremony"
    MEETING = "meeting", "Meeting"
    COMMUNITY = "community", "Community programme"
    SPORTS = "sports", "Sports"
    OTHER = "other", "Other"


class ProjectStageChoices(models.TextChoices):
    PLANNED = "planned", "Planned"
    ONGOING = "ongoing", "Ongoing"
    COMPLETED = "completed", "Completed"


class ArchiveKindChoices(models.TextChoices):
    """
    ``satellite`` items are the dated aerial views shown side by side as
    "Ghormu through time"; everything else is the archive proper.
    """

    PHOTO = "photo", "Photo"
    DOCUMENT = "document", "Document"
    MAP = "map", "Map"
    SATELLITE = "satellite", "Satellite image"


class MapPlaceCategoryChoices(models.TextChoices):
    """What a pin on the village map marks; each has its own colour."""

    SACRED = "sacred", "Sacred place"
    SCHOOL = "school", "School"
    WATER = "water", "Water source"
    VIEWPOINT = "viewpoint", "Viewpoint"
    TRAIL = "trail", "Trail or path"
    COMMUNITY = "community", "Community place"
    HEALTH = "health", "Health"
    OTHER = "other", "Other"
