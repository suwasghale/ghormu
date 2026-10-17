"""
Shared abstract models.

Re-exports only — see ``docs/architecture.md`` on keeping package
``__init__`` files thin.
"""

from core.models.base import (
    PublishableModel,
    PublishedQuerySet,
    TimeStampedModel,
    UUIDModel,
)

__all__ = [
    "PublishableModel",
    "PublishedQuerySet",
    "TimeStampedModel",
    "UUIDModel",
]
