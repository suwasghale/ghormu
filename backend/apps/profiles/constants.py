"""
Constants for the profiles app.
"""

# ------------------------------------------------------------------------------
# Profile
# ------------------------------------------------------------------------------

BIO_MAX_LENGTH = 1000

# ------------------------------------------------------------------------------
# Avatar
# ------------------------------------------------------------------------------

AVATAR_UPLOAD_PATH = "avatars"

AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

DEFAULT_AVATAR = "defaults/avatar.webp"

AVATAR_OUTPUT_SIZE = (512, 512)

AVATAR_OUTPUT_FORMAT = "WEBP"

AVATAR_OUTPUT_QUALITY = 85

# ------------------------------------------------------------------------------
# Address
# ------------------------------------------------------------------------------

ADDRESS_LINE_MAX_LENGTH = 255

CITY_MAX_LENGTH = 100

STATE_MAX_LENGTH = 100

POSTAL_CODE_MAX_LENGTH = 20

COUNTRY_MAX_LENGTH = 100
