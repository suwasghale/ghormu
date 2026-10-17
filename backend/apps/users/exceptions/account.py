"""
Account-related exceptions.
"""

from __future__ import annotations

from core.exceptions.base import AppException


class InvalidPassword(AppException):
    """
    Raised when the supplied password is incorrect.
    """

    default_message = "Current password is incorrect."
    default_code = "invalid_password"
    status_code = 400


class AccountDeleted(AppException):
    default_message = "This account has been deleted."
    default_code = "account_deleted"
    status_code = 403


class AccountDisabled(AppException):
    default_message = "This account has been disabled."
    default_code = "account_disabled"
    status_code = 403


class InvalidAvatar(AppException):
    """
    Raised when an uploaded avatar is not a usable image.
    """

    default_message = "The uploaded file is not a valid image."
    default_code = "invalid_avatar"
    status_code = 400
