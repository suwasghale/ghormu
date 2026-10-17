"""
===============================================================================
Base Settings
===============================================================================

Base settings shared by all environments.

Inherited by:

- development.py
- production.py
- testing.py

Do not place environment-specific settings here.

===============================================================================
"""

# Components
from config.settings.components.auth import *
from config.settings.components.cache import *
from config.settings.components.celery import *
from config.settings.components.cors import *
from config.settings.components.database import *
from config.settings.components.drf import *
from config.settings.components.email import *
from config.settings.components.i18n import *
from config.settings.components.installed_apps import *
from config.settings.components.jwt import *
from config.settings.components.logging import *
from config.settings.components.middleware import *
from config.settings.components.observability import *
from config.settings.components.passwords import *
from config.settings.components.security import *
from config.settings.components.sessions import *
from config.settings.components.spectacular import *
from config.settings.components.static import *
from config.settings.components.storage import *
from config.settings.components.templates import *
from config.settings.env import *

# core django
SECRET_KEY = env("SECRET_KEY")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

# Security defaults
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_BROWSER_XSS_FILTER = True  # optional; largely obsolete on modern browsers

# applications
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# urls
ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

ASGI_APPLICATION = "config.asgi.application"

AUTH_USER_MODEL = "users.User"

# default pk
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# file uploads
FILE_UPLOAD_HANDLERS = [
    "django.core.files.uploadhandler.MemoryFileUploadHandler",
    "django.core.files.uploadhandler.TemporaryFileUploadHandler",
]

# internal ips (dev)
INTERNAL_IPS = ["127.0.0.1", "localhost"]
APPEND_SLASH = True

SILENCED_SYSTEM_CHECKS = []

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured.")

if not DATABASES:
    raise RuntimeError("DATABASES configuration is missing.")

if not INSTALLED_APPS:
    raise RuntimeError("INSTALLED_APPS cannot be empty.")

if "django.contrib.auth" not in INSTALLED_APPS:
    raise RuntimeError("django.contrib.auth must be installed.")

""" 

Documentation

Imports

Core Django

URLs

Applications

Middleware

Templates

Database

Cache

Authentication

Sessions

Internationalization

Static

Storage

Email

Logging

DRF

JWT

OpenAPI

Celery

Uploads

Misc

Validation

"""
