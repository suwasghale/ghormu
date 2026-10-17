"""Only executable inside the isolated validation database."""
import os
import sys
sys.path.insert(0, "/app")
import django
django.setup()
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from apps.users.models import User
from apps.users.models.mfa import TOTPDevice, RecoveryCode
from apps.users.services.auth.mfa import _hash_code

assert os.environ.get("E2E_FIXTURES") == "1" and settings.DATABASES["default"]["NAME"] == "ghormu_e2e"
with transaction.atomic():
    for email in ("admin@example.test", "mfa@example.test"):
        user, _ = User.objects.get_or_create(email=email, defaults={"first_name":"Test", "last_name":"Admin", "is_staff":True,"is_verified":True,"is_active":True})
        user.set_password(os.environ["E2E_PASSWORD"])
        user.save()
        if email.startswith("mfa"):
            TOTPDevice.objects.update_or_create(user=user, defaults={"secret":"JBSWY3DPEHPK3PXP", "confirmed_at":timezone.now(), "last_used_counter":None})
            RecoveryCode.objects.update_or_create(user=user, code_hash=_hash_code("A1B2-C3D4-E5F6"), defaults={"used_at":None})
    member, _ = User.objects.get_or_create(email="member@example.test", defaults={"first_name": "Member", "is_verified": True, "is_active": True})
    member.set_password(os.environ["E2E_PASSWORD"])
    member.is_staff = False
    member.save()
    # Deleted by the account-lifecycle journey, so every seed restores it
    # to an active account with no second factor.
    lifecycle, _ = User.objects.get_or_create(email="lifecycle@example.test", defaults={"first_name": "Lifecycle", "is_verified": True})
    lifecycle.set_password(os.environ["E2E_PASSWORD"])
    lifecycle.is_active, lifecycle.is_staff, lifecycle.deleted_at = True, False, None
    lifecycle.save()
    TOTPDevice.objects.filter(user=lifecycle).delete()
    RecoveryCode.objects.filter(user=lifecycle).delete()
print("Validation accounts seeded")
