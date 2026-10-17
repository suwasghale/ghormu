"""
===============================================================================
Registration Exceptions
===============================================================================

Exceptions related to user registration.
===============================================================================
"""

from core.exceptions import AppException


class RegistrationException(AppException):
    """Base exception for registration failures."""


class EmailAlreadyRegistered(RegistrationException):
    default_message = "Email address is already registered."


class UsernameAlreadyExists(RegistrationException):
    default_message = "Username is already in use."


class PhoneNumberAlreadyExists(RegistrationException):
    default_message = "Phone number is already registered."
