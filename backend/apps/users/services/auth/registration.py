"""
Business service responsible for user registration.
"""

from __future__ import annotations

from typing import Any

from django.db import transaction

from apps.users.exceptions.registration import (
    EmailAlreadyRegistered,
)
from apps.users.models import (
    User,
)
from apps.users.selectors.user import (
    exists_user_by_email,
)
from apps.users.services.auth.email_verification import create_email_verification

# =============================================================================
# Public API
# =============================================================================


@transaction.atomic
def register_user(
    *,
    data: dict[str, Any],
    created_ip: str | None = None,
    user_agent: str = "",
) -> User:
    """
    Register a new user.

    Workflow:

        - Ensure email is unique.
        - Create user.
        - Delegate email verification workflow.

    Returns:
        Newly created User.

    Raises:
        EmailAlreadyRegistered: If the email is already registered.

    """

    email = str(data["email"])
    password = str(data["password"])
    first_name = str(data.get("first_name", ""))
    last_name = str(data.get("last_name", ""))

    if exists_user_by_email(email=email):
        raise EmailAlreadyRegistered()

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    create_email_verification(
        user=user,
        created_ip=created_ip,
        user_agent=user_agent,
    )

    return user
