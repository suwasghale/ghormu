"""
===============================================================================
User Exceptions
===============================================================================

Exceptions related to user accounts.
===============================================================================
"""

from core.exceptions import AppException


class UserException(AppException):
    """Base exception for all user-related errors."""


class UserNotFound(UserException):
    default_message = "User does not exist."


class UserAlreadyExists(UserException):
    default_message = "User already exists."


class UserInactive(UserException):
    default_message = "User account is inactive."


class UserSuspended(UserException):
    default_message = "User account has been suspended."


class UserArchived(UserException):
    default_message = "User account has been archived."
