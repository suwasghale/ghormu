"""
Turning a provider profile into a local session.

The rules here are the ones that decide whether social sign-in is a
convenience or an account-takeover route.
"""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.users.choices import LoginMethodChoices
from apps.users.choices.security_event import (
    SecurityEventTypeChoices,
)
from apps.users.exceptions.authentication import (
    InvalidCredentials,
    MFARequired,
    SocialEmailNotVerified,
    SocialEmailTaken,
)
from apps.users.models import SocialAccount, User
from apps.users.services.auth.issue_session import issue_session
from apps.users.services.auth.login import LoginResult
from apps.users.services.auth.mfa import is_mfa_enabled
from apps.users.services.auth.mfa_challenge import create_challenge
from apps.users.services.auth.social.base import SocialProfile


@transaction.atomic
def login_with_social_profile(
    *,
    request,
    profile: SocialProfile,
    provider_verifies_email: bool,
) -> LoginResult:
    """
    Sign in, link, or create an account from a provider profile.

    Resolution order, and why:

    1. **An existing link wins.** Keyed on the provider subject, so a
       user whose provider email changed still lands on their account.

    2. **Otherwise match on email - but only a verified one.** Several
       providers return addresses they never confirmed. Trusting one
       lets anyone who can create an account at that provider claim the
       matching local account, which is a complete takeover.

    3. **Create only with a verified address.** An unverified one would
       let an attacker pre-register a victim's address.

    Raises:
        SocialEmailNotVerified, SocialEmailTaken, InvalidCredentials,
        MFARequired
    """

    email = (profile.email or "").strip().lower()

    # ------------------------------------------------------------------
    # 1. Existing link
    # ------------------------------------------------------------------

    link = (
        SocialAccount.objects.select_related("user")
        .filter(provider=profile.provider, subject=profile.subject)
        .first()
    )

    if link is not None:
        user = link.user

        if not user.is_active or user.deleted_at is not None:
            raise InvalidCredentials()

        link.email = email
        link.last_login_at = timezone.now()
        link.save(update_fields=["email", "last_login_at", "updated_at"])

        return _finish(request=request, user=user, profile=profile)

    # ------------------------------------------------------------------
    # No link yet: everything below needs a trustworthy address.
    # ------------------------------------------------------------------

    if not email or not (provider_verifies_email and profile.email_verified):
        raise SocialEmailNotVerified()

    existing = User.objects.filter(email=email).first()

    # ------------------------------------------------------------------
    # 2. Link to an existing local account
    # ------------------------------------------------------------------

    if existing is not None:
        if not existing.is_active or existing.deleted_at is not None:
            raise InvalidCredentials()

        # A local account already using this provider means the same
        # person has two provider identities; refuse rather than guess.
        if SocialAccount.objects.filter(
            user=existing,
            provider=profile.provider,
        ).exists():
            raise SocialEmailTaken()

        SocialAccount.objects.create(
            user=existing,
            provider=profile.provider,
            subject=profile.subject,
            email=email,
            last_login_at=timezone.now(),
        )

        return _finish(request=request, user=existing, profile=profile)

    # ------------------------------------------------------------------
    # 3. Create
    # ------------------------------------------------------------------

    user = User.objects.create_user(
        email=email,
        password=None,  # unusable: this account signs in via the provider
        first_name=profile.first_name,
        last_name=profile.last_name,
    )

    # The provider verified the address, which is the whole reason this
    # path is allowed to run.
    user.is_verified = True
    user.save(update_fields=["is_verified", "updated_at"])

    SocialAccount.objects.create(
        user=user,
        provider=profile.provider,
        subject=profile.subject,
        email=email,
        last_login_at=timezone.now(),
    )

    return _finish(request=request, user=user, profile=profile)


def _finish(
    *,
    request,
    user: User,
    profile: SocialProfile,
) -> LoginResult:
    """
    Issue a session, or stop for a second factor.

    Social sign-in does not bypass MFA. A provider proves control of a
    third-party account, which is exactly the thing a second factor
    exists to backstop.
    """

    if is_mfa_enabled(user=user):
        challenge = create_challenge(user_id=user.id)

        raise MFARequired(
            errors={
                "mfa_ticket": challenge.ticket,
                "expires_in": challenge.expires_in,
            },
        )

    login_method = {
        "google": LoginMethodChoices.GOOGLE,
        "github": LoginMethodChoices.GITHUB,
        "apple": LoginMethodChoices.APPLE,
        "microsoft": LoginMethodChoices.MICROSOFT,
    }.get(profile.provider, LoginMethodChoices.PASSWORD)

    issued = issue_session(
        request=request,
        user=user,
        login_method=login_method,
        event_type=SecurityEventTypeChoices.LOGIN,
    )

    return LoginResult(user=issued.user, tokens=issued.tokens)
