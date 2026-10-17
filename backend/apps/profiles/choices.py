from django.db import models


class AddressTypeChoices(models.TextChoices):
    HOME = "home", "Home"
    OFFICE = "office", "Office"
    BILLING = "billing", "Billing"
    SHIPPING = "shipping", "Shipping"
    OTHER = "other", "Other"
