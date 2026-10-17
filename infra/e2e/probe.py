"""Read-only inspection of isolated fixtures; useful for browser assertions."""
import json
import os
import sys
sys.path.insert(0, "/app")
import django
django.setup()
from django.conf import settings
from django.db import connection, transaction
from apps.users.models import User, UserSession
assert os.environ.get("E2E_FIXTURES") == "1" and settings.DATABASES["default"]["NAME"] == "ghormu_e2e"
print(json.dumps({"accounts": User.objects.count(), "sessions": UserSession.objects.count()}))
