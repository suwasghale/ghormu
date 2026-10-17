"""
Authentication backends.

Django's `authenticate()` is what the admin login form, `manage.py
shell`, `client.login()` and any session-based sign-in go through. The
API's own login service does not use it - it verifies the password
directly - so a lockout implemented only in that service leaves every
other entry point unprotected.

That is not a theoretical gap: `/admin/login/` is the highest-value
target on most deployments, and Django ships no brute-force protection
for it whatsoever.

`LockoutModelBackend` routes `authenticate()` through the same
per-account counters the API uses, so the two share one budget: ten
failures against an account locks it regardless of which door they came
through.
"""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import PermissionDenied

from apps.users.exceptions.authentication import AuthenticationUnavailable
from apps.users.services.auth.lockout import (
    clear_login_failures,
    is_locked_out,
    record_login_failure,
)
from core.security.request_meta import get_client_ip

logger = logging.getLogger(__name__)


class LockoutModelBackend(ModelBackend):
    """
    ModelBackend with per-account brute-force protection.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            return self._authenticate(request, username, password, **kwargs)
        except AuthenticationUnavailable as exc:
            # Stop the backend chain without leaking a 500 from Django admin.
            raise PermissionDenied from exc

    def _authenticate(
        self,
        request,
        username: str | None = None,
        password: str | None = None,
        **kwargs,
    ):
        user_model = get_user_model()

        # The admin form posts the USERNAME_FIELD value as `username`;
        # programmatic callers may pass it under its real name.
        identifier = username or kwargs.get(
            user_model.USERNAME_FIELD,
        )

        if not identifier or password is None:
            return None

        identifier = identifier.strip().lower()

        # ----------------------------------------------------------------------
        # Locked out
        #
        # PermissionDenied stops the backend chain immediately and makes
        # `authenticate()` return None, so the caller sees an ordinary
        # failed sign-in. Raising a domain exception here would instead
        # escape as a 500 from the admin login view.
        # ----------------------------------------------------------------------

        if is_locked_out(email=identifier):
            logger.warning(
                "Blocked sign-in for a locked account from %s.",
                get_client_ip(request) if request else "unknown",
            )

            raise PermissionDenied

        # ----------------------------------------------------------------------
        # Delegate
        # ----------------------------------------------------------------------

        user = super().authenticate(
            request,
            username=identifier,
            password=password,
            **kwargs,
        )

        if user is None:
            failures = record_login_failure(email=identifier)

            logger.info(
                "Failed sign-in (%s attempt(s) in window) from %s.",
                failures,
                get_client_ip(request) if request else "unknown",
            )

            return None

        clear_login_failures(email=identifier)

        return user
