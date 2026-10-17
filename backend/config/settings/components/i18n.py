"""
Internationalization configuration.
"""

from config.settings.env import BASE_DIR, env

LANGUAGE_CODE = "en"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

LANGUAGES = [
    ("en", "English"),
    ("fr", "Français"),
]

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# ISO 3166 country code used to parse phone numbers entered without a
# country prefix (e.g. "NP" or "GB"). Unset, only international numbers
# ("+977 ...") are accepted.
PHONENUMBER_DEFAULT_REGION = env("PHONENUMBER_DEFAULT_REGION", default=None) or None
