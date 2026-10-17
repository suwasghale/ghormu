"""Reset only the login bucket between isolated browser test cases."""
import os
import sys

sys.path.insert(0, "/app")
import django

django.setup()
from django.conf import settings
from core.api.throttles import LoginThrottle

if (os.environ.get("E2E_FIXTURES") != "1"
        or settings.DATABASES["default"]["NAME"] != "ghormu_e2e"
        or settings.REDIS_HOST != "redis"):
    raise RuntimeError("Login throttle reset is restricted to the validation stack")

# Preserve accounts, sessions, other scopes and production rates.
# The test still gets the real 10/minute budget; only earlier tests are removed.
pattern = LoginThrottle.cache_format % {"scope": LoginThrottle.scope, "ident": "*"}
removed = LoginThrottle.cache.delete_pattern(pattern)
if removed is None:
    raise RuntimeError("Validation Redis is unavailable; throttle reset failed")
print(f"Reset {removed} validation login throttle buckets")
