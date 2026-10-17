from core.exceptions.base import AppException


class NotFound(AppException):
    status_code = 404
    default_message = "Resource not found."
    default_code = "not_found"
