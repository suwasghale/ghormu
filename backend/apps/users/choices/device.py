from django.db import models


class DeviceTypeChoices(models.TextChoices):
    DESKTOP = "desktop", "Desktop"
    LAPTOP = "laptop", "Laptop"
    TABLET = "tablet", "Tablet"
    PHONE = "phone", "Phone"
    BOT = "bot", "Bot"
    UNKNOWN = "unknown", "Unknown"
