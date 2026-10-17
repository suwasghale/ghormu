"""
Internationalization configuration.
"""

from config.settings.env import BASE_DIR, env

# Interface language for Django's own text (admin, validation messages,
# emails) when a request sends no Accept-Language. It stays English until
# the portal and account screens are translated; the *content* default is
# Nepali and lives in core.i18n.DEFAULT_LANGUAGE.
LANGUAGE_CODE = "en"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

LANGUAGES = [
    ("ne", "नेपाली"),
    ("en", "English"),
]

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# ISO 3166 country code used to parse phone numbers entered without a
# country prefix (e.g. "NP" or "GB"). Unset, only international numbers
# ("+977 ...") are accepted.
PHONENUMBER_DEFAULT_REGION = env("PHONENUMBER_DEFAULT_REGION", default=None) or None
