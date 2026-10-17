"""
Service for creating a user session after successful authentication.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework.request import Request
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
)
from user_agents import parse

from apps.users.choices import (
    DeviceTypeChoices,
    LoginMethodChoices,
)
from apps.users.models import User, UserSession
from core.security.request_meta import get_client_ip, get_user_agent


def _get_device_type(user_agent) -> str:
    """
    Detect device type from user-agent.
    """

    if user_agent.is_mobile:
        return DeviceTypeChoices.PHONE

    if user_agent.is_tablet:
        return DeviceTypeChoices.TABLET

    if user_agent.is_pc:
        return DeviceTypeChoices.DESKTOP

    if user_agent.is_bot:
        return DeviceTypeChoices.BOT

    return DeviceTypeChoices.UNKNOWN


@transaction.atomic
def create_session(
    *,
    request: Request,
    user: User,
    outstanding_token: OutstandingToken,
    login_method: str = LoginMethodChoices.PASSWORD,
    mfa_verified: bool = False,
) -> UserSession:
    """
    Create a UserSession linked to the generated OutstandingToken.
    """

    raw_user_agent = get_user_agent(request)

    ua = parse(raw_user_agent)

    return UserSession.objects.create(
        user=user,
        token=outstanding_token,
        device_name=ua.device.family or "Unknown",
        device_type=_get_device_type(
            ua,
        ),
        browser=ua.browser.family or "",
        browser_version=ua.browser.version_string or "",
        operating_system=ua.os.family or "",
        operating_system_version=ua.os.version_string or "",
        ip_address=get_client_ip(request),
        user_agent=raw_user_agent,
        login_method=login_method,
        mfa_verified=mfa_verified,
        last_activity=timezone.now(),
    )
