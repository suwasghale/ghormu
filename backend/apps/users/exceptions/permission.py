"""
===============================================================================
Permission Exceptions
===============================================================================

Exceptions related to authorization.
===============================================================================
"""

from core.exceptions import AppException


class PermissionException(AppException):
    """Base exception for authorization failures."""


class PermissionDenied(PermissionException):
    """Raised when the current user may not perform an action."""

    status_code = 403
    default_code = "permission_denied"
    default_message = "You do not have permission to perform this action."


class AccountLocked(PermissionException):
    status_code = 403
    default_code = "account_locked"
    default_message = "Account has been temporarily locked."
