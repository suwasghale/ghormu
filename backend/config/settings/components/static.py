"""
Static and media configuration.
"""

from config.settings.env import BASE_DIR

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

# Project-owned assets. The directory is committed (with a .gitkeep) so a
# clean checkout does not raise staticfiles.W004 on every command.
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"
