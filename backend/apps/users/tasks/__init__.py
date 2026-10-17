"""
Celery tasks for the users app.

Celery's autodiscovery imports ``apps.users.tasks`` - this module - and
nothing below it. Any task module not imported here is never registered
with the worker, so scheduling it by name fails silently at runtime.
That is what happened to the session cleanup task: it existed, it was
scheduled, and it had never once run.
"""

from .emails import (
    send_email_change_verification_email,
    send_email_verification_email,
    send_password_reset_email,
    send_welcome_email,
)
from .maintenance import (
    anonymize_deleted_accounts_task,
    flush_expired_tokens_task,
)
from .security import (
    cleanup_expired_sessions_task,
    log_security_event_task,
)

__all__ = [
    "anonymize_deleted_accounts_task",
    "cleanup_expired_sessions_task",
    "flush_expired_tokens_task",
    "log_security_event_task",
    "send_email_change_verification_email",
    "send_email_verification_email",
    "send_password_reset_email",
    "send_welcome_email",
]
