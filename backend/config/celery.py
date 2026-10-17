"""
===============================================================================
Celery Application
===============================================================================

Creates and configures the Celery application for the project.

Responsibilities:
- Initialize Celery
- Load Django settings
- Auto-discover tasks
===============================================================================
"""

import os

from celery import Celery

# Default Django settings module
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings.dev",
)

# Create Celery application
app = Celery(os.environ.get("APP_SLUG", "app"))

# Load configuration from Django settings
app.config_from_object(
    "django.conf:settings",
    namespace="CELERY",
)

# Modules imported explicitly, regardless of autodiscovery.
#
# autodiscover_tasks() below finds `<app>.tasks` for each entry in
# INSTALLED_APPS, but it resolves lazily and did not pick up core.tasks
# on worker boot — the worker started without the revalidation task
# registered, so publishing in the admin queued a job nobody could run.
# Naming it here is deterministic and costs nothing.
app.conf.imports = tuple(app.conf.imports or ()) + ("core.tasks",)

# Automatically discover tasks.py inside installed apps
app.autodiscover_tasks()
