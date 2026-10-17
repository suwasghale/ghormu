"""
===============================================================================
Logging Configuration
===============================================================================

This module centralizes the logging configuration for the entire project.

Goals
-----
- Centralized logging
- Environment-aware configuration
- Rotating log files
- Docker-friendly
- Production-ready
- Easy debugging
- Future support for:
    * JSON logging
    * ELK Stack
    * Grafana Loki
    * Sentry
    * OpenTelemetry

Logging Strategy
----------------

Development
    Console + Rotating Files

Production
    Console (Docker) + Rotating Files

Log Files
---------

logs/
│
├── django.log
├── celery.log
├── errors.log
└── security.log

===============================================================================
"""

from config.settings.env import BASE_DIR, env

# =============================================================================
# Log Directory
# =============================================================================

LOG_DIR = BASE_DIR / "logs"

LOG_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

# =============================================================================
# Environment Variables
# =============================================================================

LOG_LEVEL = (
    env(
        "LOG_LEVEL",
        default="INFO",
    )
    .strip()
    .upper()
)

DB_LOG_LEVEL = (
    env(
        "DB_LOG_LEVEL",
        default="WARNING",
    )
    .strip()
    .upper()
)

LOG_MAX_BYTES = env.int(
    "LOG_MAX_BYTES",
    default=10 * 1024 * 1024,  # 10 MB
)

LOG_BACKUP_COUNT = env.int(
    "LOG_BACKUP_COUNT",
    default=10,
)

# =============================================================================
# Logger Names
# =============================================================================

PROJECT_LOGGER = "apps"

DJANGO_LOGGER = "django"

DJANGO_REQUEST_LOGGER = "django.request"

DJANGO_SERVER_LOGGER = "django.server"

DJANGO_SECURITY_LOGGER = "django.security"

DJANGO_DB_LOGGER = "django.db.backends"

CELERY_LOGGER = "celery"

# =============================================================================
# Log Files
# =============================================================================

DJANGO_LOG_FILE = LOG_DIR / "django.log"

ERROR_LOG_FILE = LOG_DIR / "errors.log"

CELERY_LOG_FILE = LOG_DIR / "celery.log"

SECURITY_LOG_FILE = LOG_DIR / "security.log"

# =============================================================================
# Formatter Strings
# =============================================================================

STANDARD_FORMAT = "[{asctime}] {levelname:<8} {name:<30} {message}"

VERBOSE_FORMAT = (
    "[{asctime}] "
    "{levelname:<8} "
    "{name:<35} "
    "{module:<20} "
    "{funcName:<25} "
    "Line:{lineno:<5} "
    "{message}"
)

SIMPLE_FORMAT = "{levelname}: {message}"

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# =============================================================================
# Formatters
# =============================================================================

FORMATTERS = {
    "simple": {
        "format": SIMPLE_FORMAT,
        "style": "{",
    },
    "standard": {
        "format": STANDARD_FORMAT,
        "style": "{",
        "datefmt": DATE_FORMAT,
    },
    "verbose": {
        "format": VERBOSE_FORMAT,
        "style": "{",
        "datefmt": DATE_FORMAT,
    },
}

# =============================================================================
# Filters
# =============================================================================

FILTERS = {
    "require_debug_true": {
        "()": "django.utils.log.RequireDebugTrue",
    },
    "require_debug_false": {
        "()": "django.utils.log.RequireDebugFalse",
    },
}

# =============================================================================
# Handlers
# =============================================================================

HANDLERS = {
    # =========================================================================
    # Console (Development Only)
    # =========================================================================
    "console": {
        "class": "logging.StreamHandler",
        "formatter": "simple",
        "filters": [
            "require_debug_true",
        ],
        "level": LOG_LEVEL,
    },
    # =========================================================================
    # Django Application Logs
    # =========================================================================
    "django_file": {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": DJANGO_LOG_FILE,
        "formatter": "verbose",
        "level": LOG_LEVEL,
        "maxBytes": LOG_MAX_BYTES,
        "backupCount": LOG_BACKUP_COUNT,
        "encoding": "utf-8",
        "delay": True,
    },
    # =========================================================================
    # Error Logs
    # =========================================================================
    "error_file": {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": ERROR_LOG_FILE,
        "formatter": "verbose",
        "level": "ERROR",
        "maxBytes": LOG_MAX_BYTES,
        "backupCount": LOG_BACKUP_COUNT,
        "encoding": "utf-8",
        "delay": True,
    },
    # =========================================================================
    # Celery Logs
    # =========================================================================
    "celery_file": {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": CELERY_LOG_FILE,
        "formatter": "verbose",
        "level": LOG_LEVEL,
        "maxBytes": LOG_MAX_BYTES,
        "backupCount": LOG_BACKUP_COUNT,
        "encoding": "utf-8",
        "delay": True,
    },
    # =========================================================================
    # Security Logs
    # =========================================================================
    "security_file": {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": SECURITY_LOG_FILE,
        "formatter": "verbose",
        "level": "WARNING",
        "maxBytes": LOG_MAX_BYTES,
        "backupCount": LOG_BACKUP_COUNT,
        "encoding": "utf-8",
        "delay": True,
    },
}

# =============================================================================
# Root Logger
# =============================================================================

ROOT_LOGGER = {
    "handlers": [
        "console",
        "django_file",
        "error_file",
    ],
    "level": LOG_LEVEL,
}


# =============================================================================
# Loggers
# =============================================================================

LOGGERS = {
    # =========================================================================
    # Django Framework
    # =========================================================================
    DJANGO_LOGGER: {
        "handlers": [
            "console",
            "django_file",
            "error_file",
        ],
        "level": LOG_LEVEL,
        "propagate": False,
    },
    # =========================================================================
    # HTTP Requests
    # =========================================================================
    DJANGO_REQUEST_LOGGER: {
        "handlers": [
            "console",
            "django_file",
            "error_file",
        ],
        "level": "ERROR",
        "propagate": False,
    },
    # =========================================================================
    # Django Development Server
    # =========================================================================
    DJANGO_SERVER_LOGGER: {
        "handlers": [
            "console",
        ],
        "level": "INFO",
        "propagate": False,
    },
    # =========================================================================
    # Security Events
    # =========================================================================
    DJANGO_SECURITY_LOGGER: {
        "handlers": [
            "console",
            "security_file",
            "error_file",
        ],
        "level": "WARNING",
        "propagate": False,
    },
    # =========================================================================
    # Database Queries
    # =========================================================================
    DJANGO_DB_LOGGER: {
        "handlers": [
            "console",
            "django_file",
        ],
        "level": DB_LOG_LEVEL,
        "propagate": False,
    },
    # =========================================================================
    # Celery
    # =========================================================================
    CELERY_LOGGER: {
        "handlers": [
            "console",
            "celery_file",
        ],
        "level": LOG_LEVEL,
        "propagate": False,
    },
    # =========================================================================
    # Project Applications
    # =========================================================================
    PROJECT_LOGGER: {
        "handlers": [
            "console",
            "django_file",
            "error_file",
        ],
        "level": LOG_LEVEL,
        "propagate": False,
    },
}


# =============================================================================
# Django Logging Configuration
# =============================================================================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": FORMATTERS,
    "filters": FILTERS,
    "handlers": HANDLERS,
    "loggers": LOGGERS,
    "root": ROOT_LOGGER,
}

INFRASTRUCTURE_LOGGER = "infrastructure"

CORE_LOGGER = "core"
