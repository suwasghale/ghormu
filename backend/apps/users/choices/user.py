from django.db import models


class UserTypeChoices(models.TextChoices):
    ADMIN = "admin", "Administrator"
    MEMBER = "member", "Member"
    SPONSOR = "sponsor", "Sponsor"
    VOLUNTEER = "volunteer", "Volunteer"
