"""
Signals the users app sends.

Other apps depend on users, never the reverse, so anything another app
must do when an account changes is announced here and handled there.
"""

from __future__ import annotations

from django.dispatch import Signal

# Sent inside the anonymization transaction, after the account's own
# identifying data has been removed. Receivers erase whatever personal
# data their app holds for `user`. An exception in a receiver rolls the
# whole anonymization back, so the account is retried on the next run
# rather than left half-erased.
account_anonymized = Signal()
