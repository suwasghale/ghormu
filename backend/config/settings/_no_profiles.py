"""
Settings with the profiles app removed.

Used only by tests/unit/test_app_boundaries.py to prove that a fork
which deletes apps/profiles still has a working authentication system.
Not for any other purpose.
"""

from .test import *  # noqa: F401,F403

INSTALLED_APPS = [  # noqa: F405
    app
    for app in INSTALLED_APPS  # noqa: F405
    if app != "apps.profiles"
]

ROOT_URLCONF = "config._urls_no_profiles"
