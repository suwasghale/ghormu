"""
Celery tasks for user-related emails.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


# =============================================================================
# Internal Helper
# =============================================================================


def _base_context() -> dict:
    """
    Values every template expects.

    Branding lives in settings rather than in the templates, so forking
    this project means changing APP_NAME rather than editing markup.
    """

    return {
        "site_name": settings.EMAIL_SITE_NAME,
        "site_tagline": settings.APP_TAGLINE,
        "frontend_url": settings.FRONTEND_URL,
    }


def _send_email(
    *,
    subject: str,
    recipient: str,
    html_template: str,
    text_template: str,
    context: dict,
) -> int:
    """
    Render and send a multipart email.

    Returns:
        Number of messages delivered.
    """

    context = {**_base_context(), **context}

    text_body = render_to_string(
        text_template,
        context,
    )

    html_body = render_to_string(
        html_template,
        context,
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )

    message.attach_alternative(
        html_body,
        "text/html",
    )

    sent = message.send(
        fail_silently=False,
    )

    # Recipient addresses are personal data and must not be written to
    # logs or to scratch files on the worker.
    logger.info(
        "Sent %r email (delivered=%s).",
        subject,
        sent,
    )

    return sent


# Shared retry policy. Email delivery fails for transient reasons far
# more often than permanent ones, so every task retries with backoff.
EMAIL_TASK_OPTIONS = {
    "autoretry_for": (Exception,),
    "retry_backoff": True,
    "retry_jitter": True,
    "retry_kwargs": {
        "max_retries": settings.EMAIL_MAX_RETRIES,
    },
}


# =============================================================================
# Password Reset
# =============================================================================


@shared_task(**EMAIL_TASK_OPTIONS)
def send_password_reset_email(
    *,
    recipient: str,
    full_name: str,
    reset_url: str,
) -> None:
    """
    Send a password reset email.
    """

    _send_email(
        subject=str(_("Reset your password")),
        recipient=recipient,
        html_template="emails/password_reset.html",
        text_template="emails/password_reset.txt",
        context={
            "full_name": full_name,
            "reset_url": reset_url,
            "expires_in_minutes": (settings.PASSWORD_RESET_TOKEN_LIFETIME_MINUTES),
        },
    )


# =============================================================================
# Email Verification
# =============================================================================


@shared_task(**EMAIL_TASK_OPTIONS)
def send_email_verification_email(
    *,
    recipient: str,
    full_name: str,
    verification_url: str,
) -> None:
    """
    Send an email address verification email.
    """

    _send_email(
        subject=str(_("Verify your email address")),
        recipient=recipient,
        html_template="emails/verification.html",
        text_template="emails/verification.txt",
        context={
            "full_name": full_name,
            "verification_url": verification_url,
            "expires_in_hours": (settings.EMAIL_VERIFICATION_TOKEN_LIFETIME_HOURS),
        },
    )


# =============================================================================
# Welcome
# =============================================================================


@shared_task(**EMAIL_TASK_OPTIONS)
def send_welcome_email(
    *,
    recipient: str,
    full_name: str,
) -> None:
    """
    Send a welcome email.
    """

    _send_email(
        subject=str(_("Welcome")),
        recipient=recipient,
        html_template="emails/welcome.html",
        text_template="emails/welcome.txt",
        context={
            "full_name": full_name,
        },
    )


# =============================================================================
# Change Email
# =============================================================================


@shared_task(**EMAIL_TASK_OPTIONS)
def send_email_change_verification_email(
    *,
    recipient: str,
    full_name: str,
    verification_url: str,
) -> None:
    """
    Send an email change verification email.
    """

    _send_email(
        subject=str(_("Confirm your new email address")),
        recipient=recipient,
        html_template="emails/email_change.html",
        text_template="emails/email_change.txt",
        context={
            "full_name": full_name,
            "verification_url": verification_url,
            "expires_in_hours": int(
                settings.EMAIL_CHANGE_TOKEN_LIFETIME.total_seconds() // 3600
            ),
        },
    )
