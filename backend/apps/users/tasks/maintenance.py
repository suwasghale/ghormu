"""
Periodic maintenance tasks.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    name="apps.users.tasks.maintenance.flush_expired_tokens",
)
def flush_expired_tokens_task() -> int:
    """
    Delete outstanding refresh tokens that have already expired.

    ``OutstandingToken`` gains a row per login and never loses one, so
    the table and its blacklist join grow without bound. Once a refresh
    token is past its expiry it can never be presented successfully, so
    the row carries no security value.

    Returns:
        Number of rows deleted.
    """

    from rest_framework_simplejwt.token_blacklist.models import (
        OutstandingToken,
    )

    deleted, _ = OutstandingToken.objects.filter(expires_at__lt=timezone.now()).delete()

    logger.info(
        "Flushed %s expired outstanding token(s).",
        deleted,
    )

    return deleted


@shared_task(
    name="apps.users.tasks.maintenance.anonymize_deleted_accounts",
)
def anonymize_deleted_accounts_task() -> int:
    """
    Anonymize deleted accounts whose grace period has ended.

    Returns:
        Number of accounts anonymized.
    """

    from apps.users.services.auth.anonymize_account import (
        anonymize_expired_deleted_accounts,
    )

    anonymized = anonymize_expired_deleted_accounts()

    logger.info(
        "Anonymized %s deleted account(s).",
        anonymized,
    )

    return anonymized
